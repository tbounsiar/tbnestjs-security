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
  private constructor() {}

  static new() {
    return new this();
  }

  loginPage(loginPage: string): this;
  /**
   * @internal
   */
  loginPage(): string;
  loginPage(loginPage?: string): this | string {
    if (loginPage === undefined) {
      return this._loginPage;
    }
    this._loginPage = loginPage;
    return this;
  }

  loginUrl(loginUrl: string): this;
  /**
   * @internal
   */
  loginUrl(): string;
  loginUrl(loginUrl?: string): this | string {
    if (loginUrl === undefined) {
      return this._loginUrl;
    }
    this._loginUrl = loginUrl;
    return this;
  }

  logoutUrl(logoutUrl: string): this;
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
