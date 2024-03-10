import { TokenAuthenticationProvider } from '../token-authentication.provider';
import { JwtTokenParser } from './jwt-token.parser';
import { JwtTokenOptions } from './jwt-token.options';

export class JwtTokenAuthenticationProvider extends TokenAuthenticationProvider {
  /**
   * @internal
   * @private
   */
  private readonly _jwtTokenParser: JwtTokenParser;

  /**
   * @internal
   */
  constructor(options: JwtTokenOptions) {
    super(options);
    this._jwtTokenParser = new JwtTokenParser(options.secret(), options.jwt());
    this.tokenParser(this._jwtTokenParser);
  }

  jwtTokenParser(): JwtTokenParser {
    return this._jwtTokenParser;
  }
}
