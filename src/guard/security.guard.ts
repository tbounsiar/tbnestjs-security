import { CanActivate, ExecutionContext, Injectable, RequestMethod, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { getExpression, PreAuthorize } from './decorator/preAuthorize.decorator';
import { AuthenticateType, AuthenticationProvider } from '../core/auth/abstract/authenticationProvider';
import { HttpSecurity } from '../core/http/httpSecurity';
import { AuthErrorHandling } from '../core/auth/abstract/authErrorHandling';
import { FormLogin, SessionAuthenticationProvider } from '../core/auth/impl/sessionAuthenticationProvider';
import { RequestMatcher } from '../core/http/requestMatcher';
import { WWWAuthenticationProvider } from '../core/auth/impl/wwwAuthenticationProvider';
import { pathToRegex } from '../core/utils/utils';

/**
 * @internal
 */
@Injectable()
export class SecurityGuard implements CanActivate {

  private readonly loginRegex: RegExp;

  constructor(
    private reflector: Reflector,
    private authenticationProvider: AuthenticationProvider,
    private httpSecurity: HttpSecurity,
    private authErrorHandling: AuthErrorHandling,
  ) {
    if (
      this.authenticationProvider.authenticateType() ===
      AuthenticateType.FORM_LOGIN
    ) {
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
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    if (
      this.authenticationProvider.authenticateType() ===
      AuthenticateType.FORM_LOGIN &&
      this.isLoginForm(context)
    ) {
      return true;
    }
    if (this.validateMatcher(context)) {
      return true;
    }
    return false;
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
          // response.status(401).send(this.authErrorHandling.unauthorized().getResponse());
        };
        break;
      case AuthenticateType.FORM_LOGIN:
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
      if (!expression || eval(expression)) {
        return true;
      }
    } catch (error) {
      // check if throwed ar @ref *
      const isUnauthorizedException = error instanceof UnauthorizedException;
      if (errorHandler) {
        errorHandler(isUnauthorizedException ? undefined : error);
      }
      throw isUnauthorizedException ? error : this.authErrorHandling.unauthorized();
    }
    throw this.authErrorHandling.forbidden();
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
