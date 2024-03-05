import { TokenParser } from '../iface/tokenParser';
import { RequestAuthentication } from '../../abstract/requestAuthentication';
import { TokenError } from '../tokenError';
import { RequestAuthenticationImpl } from '../../impl/requestAuthenticationImpl';
import { Authentication } from '../../abstract/authentication';
import { JwtDataExtractor } from './jwtDataExtractor';
import { JwtDataExtractorImpl } from './jwtDataExtractorImpl';

/**
 *
 */
export class JwtTokenParser implements TokenParser {

  /**
   * @internal
   */
  private _jwtDataExtractor: JwtDataExtractor = new JwtDataExtractorImpl();

  constructor(
    private secret: string,
    private jwt: any,
  ) {
  }

  parse(token: string): RequestAuthentication {
    if (token == undefined) {
      return new RequestAuthenticationImpl();
    }
    try {
      const decoded = this.jwt.verify(
        token,
        this.secret,
      );

      const authentication = {
        username: this._jwtDataExtractor?.getUsername(decoded),
        roles: this._jwtDataExtractor?.getRoles(decoded),
        authorities: this._jwtDataExtractor.getAuthorities(decoded),
      } as unknown as Authentication;
      return new RequestAuthenticationImpl(authentication);
    } catch (error: any) {
      throw new TokenError('Invalid Token', 'invalid_token', error.message);
    }
  }

  dataExtractor(
    jwtAuthorization: JwtDataExtractor,
  ): JwtTokenParser;
  dataExtractor(): JwtDataExtractor;

  dataExtractor(
    jwtAuthorization?: JwtDataExtractor,
  ): JwtTokenParser | JwtDataExtractor {
    if (!jwtAuthorization) {
      return this._jwtDataExtractor;
    }
    this._jwtDataExtractor = jwtAuthorization;
    return this;
  }
}
