/**
 * Interface to implement a new Authentication
 */
export interface UserAuthentication {
  username: string;
  password?: string;
  authorities: string[];
  roles: string[];
}
