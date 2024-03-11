import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  RequestMethod,
  UnauthorizedException
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import {
  getExpression,
  PreAuthorize
} from './decorator/pre-authorize.decorator';
import { AuthenticationProvider } from '../core/auth/abstract/authentication.provider';
import { HttpSecurity } from '../core/http/http.security';
import {
  Permission,
  PermissionFunction,
  RequestMatcher
} from '../core/http/request.matcher';
import { WwwAuthenticationProvider } from '../core/auth/abstract/www-authentication.provider';
import { pathToRegex } from '../core/utils/regex.utils';
import { CsrfToken, CsrfTokenError } from '../core/http/csrf.token';
import { AuthenticationErrorHandling } from '../core/auth/abstract/authentication-error.handling';
import { FormLogin } from '../core/auth/impl/session/form-login';
import { SessionError } from '../core/auth/impl/session/session.error';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

/**
 * @internal
 */
export const securityGuardProvider: FactoryProvider<SecurityGuard> = {
  provide: APP_GUARD,
  useFactory: (
    reflector: Reflector,
    httpSecurity: HttpSecurity,
    authErrorHandling: AuthenticationErrorHandling,
    authenticationProvider?: AuthenticationProvider,
    formLogin?: FormLogin,
    csrfToken?: CsrfToken
  ) => {
    return new SecurityGuard(
      reflector,
      httpSecurity,
      authErrorHandling,
      authenticationProvider,
      formLogin,
      csrfToken
    );
  },
  inject: [
    Reflector,
    HttpSecurity,
    AuthenticationErrorHandling,
    {
      token: AuthenticationProvider,
      optional: true
    },
    {
      token: FormLogin,
      optional: true
    },
    {
      token: CsrfToken,
      optional: true
    }
  ]
};

/**
 * @internal
 */
class SecurityGuard implements CanActivate {
  private readonly loginRegex: RegExp;

  constructor(
    private readonly reflector: Reflector,
    private readonly httpSecurity: HttpSecurity,
    private readonly authErrorHandling: AuthenticationErrorHandling,
    private readonly authenticationProvider?: AuthenticationProvider,
    private readonly formLogin?: FormLogin,
    private readonly csrfToken?: CsrfToken
  ) {
    if (formLogin) {
      const loginUrls = [
        new RegExp(formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE)
          .source,
        new RegExp(formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL).source,
        new RegExp(formLogin.logoutUrl() || FormLogin.DEFAULT_LOGOUT_URL).source
      ];
      this.loginRegex = pathToRegex(...loginUrls);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isLoginForm(context)) {
      return true;
    }
    if (await this.validateMatcher(context)) {
      return true;
    }
    return false;
  }

  private isLoginForm(context: ExecutionContext) {
    if (this.loginRegex) {
      const request = context.switchToHttp().getRequest();
      const path = request.originalUrl;
      return this.loginRegex.test(path);
    }
    return false;
  }

  private async validateMatcher(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = RequestMethod[request.method] as unknown as RequestMethod;
    const path = request.originalUrl;
    const permissions = this.httpSecurity.getPermission(path, method);
    const permissionsStack = this.buildPermissionStack(context, permissions);
    if (
      permissionsStack.length === 1 &&
      permissionsStack[0] === RequestMatcher.PERMIT_ALL
    ) {
      return true;
    }

    return this.validatePermission(
      context,
      permissionsStack.length > 0 ? permissionsStack : undefined
    );
  }

  private async validatePermission(
    context: ExecutionContext,
    permissions?: PermissionFunction[]
  ) {
    if (this.authenticationProvider) {
      let errorHandler = null;
      let redirect = null;
      const request = context.switchToHttp().getRequest();

      if (this.authenticationProvider instanceof WwwAuthenticationProvider) {
        errorHandler = (error: any) => {
          const [key, value] = (
            this.authenticationProvider as WwwAuthenticationProvider
          ).getAskHeader(error);
          const response = context.switchToHttp().getResponse();
          response.header(key, value);
        };
      } else if (this.formLogin) {
        redirect = () => {
          const response = context.switchToHttp().getResponse();
          response
            .status(302)
            .redirect(
              `${this.formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE}?from=${request.originalUrl}`
            );
        };
      }

      try {
        const authentication =
          await this.authenticationProvider.getAuthentication(request);
        if (!authentication.isAuthenticated()) {
          if (redirect) {
            redirect();
            return;
          }
          // @ref *
          throw new UnauthorizedException();
        }
        if (this.csrfToken && !this.csrfToken.check(request)) {
          throw new CsrfTokenError('Forbidden: CSRF token does not match');
        }
        if (!permissions) {
          return true;
        }
        const conditions = [];
        for (let i = 0; i < permissions.length; i++) {
          conditions.push(`permissions[${i}](authentication, request)`);
        }
        const code = conditions.join(' && ');
        if (eval(code)) {
          return true;
        }
      } catch (error) {
        if (error instanceof SessionError) {
          throw error;
        }
        if (error instanceof CsrfTokenError) {
          throw new ForbiddenException(error.message);
        }
        // check if throwed ar @ref *
        const isUnauthorizedException = error instanceof UnauthorizedException;
        if (errorHandler) {
          errorHandler(isUnauthorizedException ? undefined : error);
        }
        throw isUnauthorizedException
          ? error
          : this.authErrorHandling.unauthorized(context);
      }
      throw this.authErrorHandling.forbidden(context);
    }
    throw this.authErrorHandling.unauthorized(context);
  }

  private getDecoratorExpression(context: ExecutionContext): Permission {
    const authorization = this.reflector.get(
      PreAuthorize,
      context.getHandler()
    );
    if (authorization) {
      if (typeof authorization === 'string') {
        return getExpression(authorization);
      }
      return authorization;
    }
    return undefined;
  }

  private buildPermissionStack(
    context: ExecutionContext,
    permissions: Permission[][]
  ) {
    const permissionsStack: PermissionFunction[] = [];
    const decoratorExpression = this.getDecoratorExpression(context);
    if (decoratorExpression) {
      if (typeof decoratorExpression === 'string') {
        const code = `(authentication, request) => ${decoratorExpression}`;
        permissionsStack.push(eval(code));
      } else {
        permissionsStack.push(decoratorExpression);
      }
    }
    for (const permission of permissions) {
      const permitAll = permission.findIndex(
        (p) => p === RequestMatcher.PERMIT_ALL
      );
      if (permitAll >= 0) {
        permissionsStack.push(RequestMatcher.PERMIT_ALL);
        continue;
      }
      const data: {
        match?: string;
        functions?: PermissionFunction[];
      } = {};
      const matchPermissions = permission.filter((p) => typeof p === 'string');
      if (matchPermissions.length > 0) {
        data.match = matchPermissions
          .map((permission) =>
            (permission as string).replace(/\$./g, 'authentication.')
          )
          .join(' || ');
      }
      const functionPermissions = permission.filter(
        (p) => typeof p === 'function'
      );
      if (functionPermissions.length > 0) {
        data.functions = functionPermissions as PermissionFunction[];
      }

      permissionsStack.push(this.buildPermissionFunction(data));
    }
    return permissionsStack;
  }

  buildPermissionFunction(data: {
    match?: string;
    functions?: PermissionFunction[];
  }): PermissionFunction {
    const conditions = [];
    if (data.match) {
      conditions.push(data.match);
    }
    if (data.functions && data.functions.length > 0) {
      for (let i = 0; i < data.functions.length; i++) {
        conditions.push(`data.functions[${i}](authentication, request)`);
      }
    }
    const code = `(authentication, request) => ${conditions.join(' || ')}`;
    return eval(code);
  }
}
