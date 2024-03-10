import { RequestAuthentication } from '../../abstract/model/request.authentication';

export interface TokenParser {
  parse(token: string): RequestAuthentication;
}
