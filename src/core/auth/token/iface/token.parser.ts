import { RequestAuthentication } from '../../abstract/model/request.authentication';

/**
 * Header Authorization token parser
 */
export interface TokenParser {
  parse(token: string): RequestAuthentication;
}
