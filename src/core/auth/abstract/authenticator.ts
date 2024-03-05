import { Authentication } from './authentication';

/**
 * Interface to implement a new login password authenticator
 */
export abstract class Authenticator {
  /**
   * Get authentication using login and password
   * @param username {string}: login value
   * @param password {string}: password value
   */
  abstract authenticate(
    username: string,
    password?: string,
  ): Authentication;
}
