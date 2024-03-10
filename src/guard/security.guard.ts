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
import { RequestMatcher } from '../core/http/request.matcher';
import { WwwAuthenticationProvider } from '../core/auth/abstract/www-authentication.provider';
import { pathToRegex } from '../core/utils/regex.utils';
import { CsrfTokenError } from '../core/http/csrf.token';
import { AuthenticationErrorHandling } from '../core/auth/abstract/authentication-error.handling';
import { FormLogin } from '../core/auth/impl/session/form-login';
import { SessionError } from '../core/auth/impl/session/session.error';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export const securityGuardProvider: FactoryProvider<SecurityGuard> = {
  provide: APP_GUARD,
  useFactory: (
    reflector: Reflector,
    httpSecurity: HttpSecurity,
    authErrorHandling: AuthenticationErrorHandling,
    authenticationProvider?: AuthenticationProvider,
    formLogin?: FormLogin
  ) => {
    return new SecurityGuard(
      reflector,
      httpSecurity,
      authErrorHandling,
      authenticationProvider,
      formLogin
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
    private readonly formLogin?: FormLogin
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
    if (this.authenticationProvider) {
      if (this.isLoginForm(context)) {
        return true;
      }
      if (await this.validateMatcher(context)) {
        return true;
      }
      return false;
    }
    throw this.authErrorHandling.unauthorized(context);
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

    const expressions = [];
    if (permissions.length > 0) {
      const permitAll = permissions.find(
        (permission) => permission === RequestMatcher.PERMIT_ALL
      );
      if (permitAll) {
        return true;
      }
      const matchExpression = permissions
        .map((permission) => `authentication.${permission}`)
        .join(' || ');
      expressions.push(matchExpression);
    }
    const decoratorExpression = this.getDecoratorExpression(context);
    if (decoratorExpression) {
      expressions.push(decoratorExpression);
    }
    let expression = undefined;
    if (expressions.length > 0) {
      expression =
        expressions.length > 1
          ? expressions.map((exp) => `(${exp})`).join(' && ')
          : expressions[0];
    }
    return this.validatePermission(context, expression);
  }

  private async validatePermission(
    context: ExecutionContext,
    expression?: string
  ) {
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
      if (
        this.httpSecurity.csrfToken() &&
        !this.httpSecurity.csrfToken().check(request)
      ) {
        throw new CsrfTokenError('Forbidden: CSRF token does not match');
      }
      if (!expression || eval(expression)) {
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

  private getDecoratorExpression(context: ExecutionContext): string {
    const authorization = this.reflector.get(
      PreAuthorize,
      context.getHandler()
    );
    if (authorization) {
      return getExpression(authorization);
    }
    return undefined;
  }
}
