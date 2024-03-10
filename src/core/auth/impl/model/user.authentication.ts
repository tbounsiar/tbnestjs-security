import { Authentication } from '../../abstract/model/authentication';

export interface UserAuthentication extends Authentication {
  password: string;
}
