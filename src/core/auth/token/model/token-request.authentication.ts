import { RequestAuthenticationImpl } from '../../impl/model/request.authentication.impl';
import { TokenAuthentication } from './token.authentication';

export class TokenRequestAuthentication extends RequestAuthenticationImpl<TokenAuthentication> {
  getDecoded() {
    return this.authentication?.decoded;
  }

  getToken() {
    return this.authentication?.token;
  }
}
