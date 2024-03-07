import {
  CanActivate,
  ExecutionContext, ForbiddenException,
  Injectable, Logger,
  OnModuleInit,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ModuleRef, Reflector } from '@nestjs/core';
import { getExpression, PreAuthorize } from './decorator/preAuthorize.decorator';
import { AuthenticateType, AuthenticationProvider } from '../core/auth/abstract/authenticationProvider';
import { HttpSecurity } from '../core/http/httpSecurity';
import { AuthErrorHandling } from '../core/auth/abstract/authErrorHandling';
import { FormLogin, SessionAuthenticationProvider } from '../core/auth/impl/sessionAuthenticationProvider';
import { RequestMatcher } from '../core/http/requestMatcher';
import { WWWAuthenticationProvider } from '../core/auth/impl/wwwAuthenticationProvider';
import { pathToRegex } from '../core/utils/regex.utils';
import { CsrfService } from '../core/http/csrf.service';

/**
 * @internal
 */
@Injectable()
export class SecurityGuard implements CanActivate, OnModuleInit {

  /**
   * @internal
   * @private
   */
  private readonly logger = new Logger(SecurityGuard.name);

  private loginRegex: RegExp;
  private authenticationProvider: AuthenticationProvider;
  private csrfService: CsrfService;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
    private readonly httpSecurity: HttpSecurity,
    private readonly authErrorHandling: AuthErrorHandling,
  ) {
  }

  onModuleInit() {
    try {
      this.csrfService = this.moduleRef.get(CsrfService, { strict: false });
    } catch (error) {
    }
    try {
      this.authenticationProvider = this.moduleRef.get(AuthenticationProvider, { strict: false });
      if (
        this.authenticationProvider && this.authenticationProvider.authenticateType() ===
        AuthenticateType.SESSION
      ) {
        if (!this.csrfService) {
          this.logger.warn('You are using authentication session but CSRF protection is not enabled!');
        }
        const formLogin = (
          this.authenticationProvider as SessionAuthenticationProvider
        ).formLogin();
        const loginUrls = [
          new RegExp(formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE).source,
          new RegExp(formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL).source,
          new RegExp(formLogin.logoutUrl() || FormLogin.DEFAULT_LOGOUT_URL).source,
        ];
        this.loginRegex = pathToRegex(...loginUrls);
      }
    } catch (error) {

    }
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    if (this.authenticationProvider) {
      if (
        this.authenticationProvider.authenticateType() ===
        AuthenticateType.SESSION &&
        this.isLoginForm(context)
      ) {
        return true;
      }
      if (this.validateMatcher(context)) {
        return true;
      }
      return false;
    }
    throw this.authErrorHandling.unauthorized(context);
  }

  private isLoginForm(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = request.originalUrl;
    return this.loginRegex.test(path);
  }

  private validateMatcher(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = RequestMethod[request.method] as unknown as RequestMethod;
    const path = request.originalUrl;
    const permissions = this.httpSecurity.getPermission(path, method);

    if (permissions.length > 0) {
      const permitAll = permissions.find(permission => permission === RequestMatcher.PERMIT_ALL);
      if (permitAll) {
        return true;
      }
      const expressions = [];
      const matchExpression = permissions.map(permission => `authentication.${permission}`).join(' || ');
      if (matchExpression) {
        expressions.push(matchExpression);
      }
      const decoratorExpression = this.getDecoratorExpression(context);
      if (decoratorExpression) {
        expressions.push(decoratorExpression);
      }
      let expression = undefined;
      if (expressions.length > 0) {
        expression = expressions.length > 1 ? expressions.map(exp => `(${exp})`).join(' && ') : expressions[0];
      }
      return this.validatePermission(context, expression);
    } else {
      return this.validateDecorator(context);
    }
  }

  private validatePermission(context: ExecutionContext, expression?: string) {


    let errorHandler = null;
    let redirect = null;
    const authenticateType = this.authenticationProvider.authenticateType();
    const request = context.switchToHttp().getRequest();
    switch (authenticateType) {
      case AuthenticateType.BASIC:
      case AuthenticateType.DIGEST:
      case AuthenticateType.BEARER:
        errorHandler = (error: any) => {
          const [key, value] = (
            this.authenticationProvider as WWWAuthenticationProvider
          ).getAskHeader(error);
          const response = context.switchToHttp().getResponse();
          response.header(key, value);
        };
        break;
      case AuthenticateType.SESSION:
        const formLogin = (
          this.authenticationProvider as SessionAuthenticationProvider
        ).formLogin();

        redirect = () => {
          const response = context.switchToHttp().getResponse();
          response
            .status(302)
            .redirect(
              `${formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE}?from=${request.originalUrl}`,
            );
        };
        break;
      default:
        break;
    }
    try {
      const authentication = this.authenticationProvider.getAuthentication(request);
      if (!authentication.isAuthenticated()) {
        if (redirect) {
          redirect();
          return;
        }
        // @ref *
        throw new UnauthorizedException();
      }
      if (this.csrfService && !this.csrfService.check(request)) {
        throw new ForbiddenException('CSRF token does not match');
      }
      if (!expression || eval(expression)) {
        return true;
      }
    } catch (error) {
      // check if throwed ar @ref *
      const isUnauthorizedException = error instanceof UnauthorizedException;
      if (errorHandler) {
        errorHandler(isUnauthorizedException ? undefined : error);
      }
      throw isUnauthorizedException ? error : this.authErrorHandling.unauthorized(context);
    }
    throw this.authErrorHandling.forbidden(context);
  }

  private getDecoratorExpression(context: ExecutionContext): string {
    const authorization = this.reflector.get(
      PreAuthorize,
      context.getHandler(),
    );
    if (authorization) {
      return getExpression(authorization);
    }
    return undefined;
  }

  private validateDecorator(context: ExecutionContext): boolean {
    const expression = this.getDecoratorExpression(context);
    if (expression) {
      return this.validatePermission(context, expression);
    }
    return this.validatePermission(context);
  }
}
