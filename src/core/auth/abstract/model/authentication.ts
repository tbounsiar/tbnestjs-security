/**
 * Interface to implement a new Authentication
 */
export interface Authentication {
  username: string;
  password?: string;
  authorities: string[];
  roles: string[];
}
