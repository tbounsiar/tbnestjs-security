import { RequestAuthentication } from '../../abstract/requestAuthentication';

export interface TokenParser {
  parse(token: string): RequestAuthentication;
}
