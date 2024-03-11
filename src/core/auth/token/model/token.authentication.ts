import { UserAuthentication } from '../../abstract/model/user.authentication';

export interface TokenAuthentication extends UserAuthentication {
  token: string;
  decoded: any;
}
