import {
  AuthenticationProvider,
  ProviderOptions
} from './authentication.provider';
import { TokenError } from '../token/error/token-error';

/**
 * @internal
 * Class for WWW-Authenticate implementation
 */
export abstract class WwwAuthenticationProvider extends AuthenticationProvider {
  /**
   * @internal
   * @param authorizationRegExp
   * @param options
   * @protected
   */
  protected constructor(
    /**
     * @internal
     */
    private authorizationRegExp: RegExp,
    private options: WwwOptions
  ) {
    super();
  }

  /**
   * @internal
   * @param error
   */
  getAskHeader(error?: Error): string[] {
    const key = `${this.options?.isProxy() ? 'Proxy' : 'WWW'}-Authenticate`;
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
    const authorization =
      request.headers[`${this.options.isProxy() ? 'proxy-' : ''}authorization`];
    if (!authorization) {
      return undefined;
    }
    if (!this.authorizationRegExp.test(authorization)) {
      throw new TokenError(
        'Invalid Authorization',
        'invalid_authorization',
        `Invalid ${this.options.isProxy() ? 'proxy-' : ''}authorization(${authorization})`
      );
    }
    return this.authorizationRegExp.exec(authorization);
  }
}

export abstract class WwwOptions extends ProviderOptions {
  /**
   * @internal
   */
  protected _realm = 'NestJS-Security Application';
  /**
   * @internal
   */
  private _proxy = false;

  realm(realm: string): this;
  /**
   * @internal
   */
  realm(): string;
  /**
   * Set WWW-Authenticate realm
   * @param {string} realm realm value
   */
  realm(realm?: string): this | string {
    if (realm === undefined) {
      return this._realm;
    }
    this._realm = realm;
    return this;
  }

  /**
   * @internal
   */
  isProxy(): boolean {
    return this._proxy;
  }

  /**
   * Activate WWW-Authenticate proxy authentication
   */
  proxy(): this | boolean {
    this._proxy = true;
    return this;
  }
}
