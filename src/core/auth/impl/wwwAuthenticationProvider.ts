import { AuthenticateType, AuthenticationProvider } from '../abstract/authenticationProvider';
import { TokenError } from '../token/tokenError';

/**
 * Class for WWW-Authenticate implementation
 */
export abstract class WWWAuthenticationProvider extends AuthenticationProvider {

  /**
   * @internal
   */
  protected _realm = 'NestJS-Security Application';
  /**
   * @internal
   */
  private _proxy = false;

  /**
   * @internal
   * @param authType
   * @param authorizationRegExp
   * @protected
   */
  protected constructor(
    authType: AuthenticateType,
    /**
     * @internal
     */
    private authorizationRegExp: RegExp,
  ) {
    super(authType);
  }

  /**
   * Set WWW-Authenticate realm
   * @param {string} realm realm value
   */
  realm(realm: string): this {
    this._realm = realm;
    return this;
  }

  /**
   * Activate WWW-Authenticate proxy authentication
   */
  proxy(): this {
    this._proxy = true;
    return this;
  }

  /**
   * @internal
   * @param error
   */
  getAskHeader(error?: Error): string[] {
    const key = `${this._proxy ? 'Proxy' : 'WWW'}-Authenticate`;
    const value = this.getAskHeaderValue(error);
    return [key, value];
  }


  /**
   * @internal
   */
  protected abstract getAskHeaderValue(error?: Error): string;

  /**
   * @internal
   */
  protected getAuthorization(request: any): RegExpExecArray {
    const authorization = request.headers[`${this._proxy ? 'proxy-' : ''}authorization`];
    if (!authorization) {
      return undefined;
    }
    if (!this.authorizationRegExp.test(authorization)) {
      throw new TokenError('Invalid Authorization', 'invalid_authorization', `Invalid ${this._proxy ? 'proxy-' : ''}authorization(${authorization})`);
    }
    return this.authorizationRegExp.exec(authorization);
  }
}
