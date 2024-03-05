import { WWWAuthenticationProvider } from '../impl/wwwAuthenticationProvider';
import { TokenParser } from './iface/tokenParser';
import { AuthenticateType } from '../abstract/authenticationProvider';
import { RequestAuthentication } from '../abstract/requestAuthentication';
import { TokenError } from './tokenError';

/**
 * @internal
 */
const CREDENTIALS_REGEXP = /^bearer\s(.*)/i;

export class TokenAuthenticationProvider extends WWWAuthenticationProvider {
  /**
   * @private
   * @internal
   */
  private _tokenParser: TokenParser;

  /**
   * @internal
   */
  constructor() {
    super(AuthenticateType.BEARER, CREDENTIALS_REGEXP);
  }

  /**
   * @internal
   */
  protected buildAuthentication(request: any): RequestAuthentication {
    let authorization = this.getAuthorization(request);
    return this._tokenParser.parse(authorization ? authorization[1] : undefined);
  }

  tokenParser(tokenParser: TokenParser): TokenAuthenticationProvider {
    this._tokenParser = tokenParser;
    return this;
  }

  /**
   * @internal
   */
  protected getAskHeaderValue(error: TokenError): string {
    const header = [`Bearer realm="${this._realm}"`];
    if (error) {
      if (error.name) {
        header.push(`error="${error.name}"`);
      }
      if (error.description) {
        header.push(`error_description="${error.description}"`);
      }
    }
    return header.join(', ');
  }
}
