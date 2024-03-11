import { TokenParser } from '../iface/token.parser';
import { TokenError } from '../error/token-error';
import { JwtDataExtractor } from './iface/jwt-data.extractor';
import { JwtDataExtractorImpl } from './jwt-data.extractor.impl';
import { TokenAuthentication } from '../model/token.authentication';
import { TokenRequestAuthentication } from '../model/token-request.authentication';

/**
 * Default Jwt Token Parser
 * @default
 */
export class JwtTokenParser implements TokenParser {
  /**
   * @internal
   */
  private _jwtDataExtractor: JwtDataExtractor = new JwtDataExtractorImpl();
  /**
   * @internal
   */
  private jwt: any;

  constructor(
    /**
     * @internal
     */
    private secret: string
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken');
    if (!jwt) {
      throw new Error(
        'Package jsonwebtoken seems not to be installed, please do `npm i -S jsonwebtoken and retry`'
      );
    }
    this.jwt = jwt;
  }

  /**
   * @internal
   * @param token
   */
  parse(token: string): TokenRequestAuthentication {
    if (token == undefined) {
      return new TokenRequestAuthentication();
    }
    try {
      const decoded = this.jwt.verify(token, this.secret);

      const authentication = {
        decoded,
        token,
        username: this._jwtDataExtractor?.getUsername(decoded),
        roles: this._jwtDataExtractor?.getRoles(decoded),
        authorities: this._jwtDataExtractor.getAuthorities(decoded)
      } as unknown as TokenAuthentication;
      return new TokenRequestAuthentication(authentication);
    } catch (error: any) {
      throw new TokenError('Invalid Token', 'invalid_token', error.message);
    }
  }

  jwtDataExtractor(jwtDataExtractor: JwtDataExtractor): this {
    this._jwtDataExtractor = jwtDataExtractor;
    return this;
  }
}
