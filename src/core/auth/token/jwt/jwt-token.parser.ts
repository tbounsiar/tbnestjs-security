import { TokenParser } from '../iface/token.parser';
import { RequestAuthentication } from '../../abstract/model/request.authentication';
import { TokenError } from '../error/token-error';
import { RequestAuthenticationImpl } from '../../impl/model/request.authentication.impl';
import { Authentication } from '../../abstract/model/authentication';
import { DataExtractor } from '../iface/data.extractor';
import { JwtDataExtractor } from './jwt-data.extractor';
import { TokenAuthentication } from '../model/token.authentication';
import { TokenRequestAuthentication } from '../model/token-request.authentication';

/**
 *
 */
export class JwtTokenParser implements TokenParser {
  /**
   * @internal
   */
  private _jwtDataExtractor: DataExtractor = new JwtDataExtractor();

  constructor(
    private secret: string,
    private jwt: any
  ) {}

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

  dataExtractor(jwtAuthorization: DataExtractor): JwtTokenParser;
  dataExtractor(): DataExtractor;

  dataExtractor(
    jwtAuthorization?: DataExtractor
  ): JwtTokenParser | DataExtractor {
    if (!jwtAuthorization) {
      return this._jwtDataExtractor;
    }
    this._jwtDataExtractor = jwtAuthorization;
    return this;
  }
}
