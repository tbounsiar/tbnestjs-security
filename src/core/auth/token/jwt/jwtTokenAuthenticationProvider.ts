import { TokenAuthenticationProvider } from '../tokenAuthenticationProvider';
import { JwtTokenParser } from './jwtTokenParser';

export class JwtTokenAuthenticationProvider extends TokenAuthenticationProvider {

  /**
   * @internal
   * @private
   */
  private readonly _jwtTokenParser: JwtTokenParser;

  /**
   * @internal
   */
  constructor(
    secret: string,
    jwt: any,
  ) {
    super();
    this._jwtTokenParser = new JwtTokenParser(secret, jwt);
    this.tokenParser(this._jwtTokenParser);
  }

  jwtTokenParser(): JwtTokenParser {
    return this._jwtTokenParser;
  }

}
