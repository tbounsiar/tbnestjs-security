import { Authentication } from '../../abstract/model/authentication';

export interface TokenAuthentication extends Authentication {
  token: string;
  decoded: any;
}
