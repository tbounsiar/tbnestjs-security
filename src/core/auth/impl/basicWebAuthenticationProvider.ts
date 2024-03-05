import { base64Decode } from '../../utils/crypto-utils';
import { WebAuthenticationProvider } from './webAuthenticationProvider';
import { Authentication } from '../abstract/authentication';
import { AuthenticationBuilder } from '../authenticationBuilder';
import { AuthenticateType } from '../abstract/authenticationProvider';

const CREDENTIALS_REGEXP = /^basic\s(.*)/i;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

/**
 * Class for WWW-Authenticate Basic implementation
 */
export class BasicWebAuthenticationProvider extends WebAuthenticationProvider {
  /**
   * @internal
   * @private
   */
  private _charset: BufferEncoding = 'utf-8';

  /**
   * @internal
   * @param authenticationBuilder
   */
  constructor(authenticationBuilder: AuthenticationBuilder) {
    super(AuthenticateType.BASIC, CREDENTIALS_REGEXP, authenticationBuilder);
  }

  /**
   * @internal
   * @private
   */
  protected getAskHeaderValue(): string {
    return `Basic realm="${this._realm}", charset="${this._charset}"`;
  }

  /**
   * Set WWW-Authenticate Digest charset
   * @param charset {BufferEncoding}: charset value
   */
  charset(charset: BufferEncoding): this {
    this._charset = charset;
    return this;
  }

  /**
   * @internal
   * @private
   */
  protected parse(authorization: RegExpExecArray): Authentication {
    // decode user pass
    const userPassword = USER_PASS_REGEXP.exec(base64Decode(authorization[1], this._charset));
    if (!userPassword) {
      return undefined;
    }
    return this.authenticationBuilder.authenticator().authenticate(userPassword[1], userPassword[2]);
  }
}
