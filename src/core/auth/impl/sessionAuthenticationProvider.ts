import { RequestAuthentication } from '../abstract/requestAuthentication';
import { RequestAuthenticationImpl } from './requestAuthenticationImpl';
import { RequestAuthenticationProvider } from '../abstract/requestAuthenticationProvider';
import { Authentication } from '../abstract/authentication';

/**
 * @internal
 */
export const sessionAndFormMessage = `Your NestJS application is using session authentication. Please ensure that session support is properly configured. please see https://docs.nestjs.com/techniques/session`;

export interface Credentials {
  username: string;
  password: string;
}

export class SessionAuthenticationProvider extends RequestAuthenticationProvider<Credentials> {
  /**
   * @internal
   * @private
   */
  private _formLogin = FormLogin.new();

  formLogin(): FormLogin;
  formLogin(formLogin: FormLogin): SessionAuthenticationProvider;
  formLogin(formLogin?: FormLogin): FormLogin | SessionAuthenticationProvider {
    if (formLogin === undefined) {
      return this._formLogin;
    }
    this._formLogin = formLogin;
    return this;
  }

  protected buildAuthentication(request: any): RequestAuthentication {
    if (!request.session) {
      throw new Error(
        sessionAndFormMessage,
      );
    }
    return new RequestAuthenticationImpl(request.session.authentication);
  }

  setAuthentication(request: any, authentication: Authentication) {
    if (!request.session) {
      throw new Error(
        sessionAndFormMessage,
      );
    }
    if (!authentication) {
      delete request.session.authentication;
      return;
    }
    request.session.authentication = authentication;
  }
}

export class FormLogin {
  /**
   * @internal
   */
  static readonly DEFAULT_LOGIN_PAGE = '/page/login';
  /**
   * @internal
   */
  static readonly DEFAULT_LOGIN_URL = '/auth/login';
  /**
   * @internal
   */
  static readonly DEFAULT_LOGOUT_URL = '/auth/logout';

  /**
   * @internal
   */
  private _loginPage: string;
  /**
   * @internal
   */
  private _loginUrl: string;
  /**
   * @internal
   */
  private _logoutUrl: string;
  /**
   * @internal
   */
  private _redirectUrl: string;

  /**
   * @internal
   * @private
   */
  private defaultEnabled = true;

  private loginService = true;

  /**
   * @internal
   */
  private constructor() {
  }

  static new() {
    return new this();
  }

  loginPage(loginPage: string): FormLogin;
  /**
   * @internal
   */
  loginPage(): string;
  loginPage(loginPage?: string): FormLogin | string {
    if (loginPage === undefined) {
      return this._loginPage;
    }
    this._loginPage = loginPage;
    return this;
  }

  loginUrl(loginUrl: string): FormLogin;
  /**
   * @internal
   */
  loginUrl(): string;
  loginUrl(loginUrl?: string): FormLogin | string {
    if (loginUrl === undefined) {
      return this._loginUrl;
    }
    this._loginUrl = loginUrl;
    return this;
  }

  logoutUrl(logoutUrl: string): FormLogin;
  /**
   * @internal
   */
  logoutUrl(): string;
  logoutUrl(logoutUrl?: string): FormLogin | string {
    if (logoutUrl === undefined) {
      return this._logoutUrl;
    }
    this._logoutUrl = logoutUrl;
    return this;
  }

  redirectUrl(redirectUrl: string): FormLogin;
  /**
   * @internal
   */
  redirectUrl(): string;
  redirectUrl(redirectUrl?: string): FormLogin | string {
    if (redirectUrl === undefined) {
      return this._redirectUrl;
    }
    this._redirectUrl = redirectUrl;
    return this;
  }

  /**
   * @internal
   */
  isDefaultEnabled(): boolean {
    return this.defaultEnabled;
  }

  disableDefault() {
    this.defaultEnabled = false;
    return this;
  }

  isLoginService(): boolean {
    return this.loginService;
  }

  disableLoginService() {
    this.loginService = false;
    return this;
  }
}
