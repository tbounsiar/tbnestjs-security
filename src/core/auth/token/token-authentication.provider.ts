import {
  WwwAuthenticationProvider,
  WwwOptions
} from '../abstract/www-authentication.provider';
import { TokenParser } from './iface/token.parser';
import { TokenError } from './error/token-error';
import { RequestAuthentication } from '../abstract/model/request.authentication';

/**
 * @internal
 */
const CREDENTIALS_REGEXP = /^bearer\s(.*)/i;

// @ts-ignore
export class TokenAuthenticationProvider extends WwwAuthenticationProvider {
  /**
   * @private
   * @internal
   */
  private _tokenParser: TokenParser;

  /**
   * @internal
   */
  constructor(private options: WwwOptions) {
    super(CREDENTIALS_REGEXP, options);
  }

  /**
   * @internal
   */
  protected async buildAuthentication(
    request: any
  ): Promise<RequestAuthentication> {
    const authorization = this.getAuthorization(request);
    return this._tokenParser.parse(
      authorization ? authorization[1] : undefined
    );
  }

  tokenParser(tokenParser: TokenParser): this {
    this._tokenParser = tokenParser;
    return this;
  }

  /**
   * @internal
   */
  protected getAskHeaderValue(error: TokenError): string {
    const header = [`Bearer realm="${this.options.realm()}"`];
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
