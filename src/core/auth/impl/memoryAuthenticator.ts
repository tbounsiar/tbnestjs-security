import { Authenticator } from '../abstract/authenticator';
import { Authentication } from '../abstract/authentication';

export class MemoryAuthenticator extends Authenticator {
  /**
   * @internal
   * @private
   */
  private store: Record<string, MemoryAuthentication> = {};

  /**
   * @internal
   * @param login
   * @param password
   */
  authenticate(login: string, password?: string): Authentication {
    if (login) {
      const user = this.store[login];
      if (user && (!password || user.password === password)) {
        return user;
      }
    }
    return undefined;
  }


  /**
   * Add new User
   * @param user {MemoryAuthentication}: user
   */
  addUser(user: MemoryAuthentication): this {
    this.store[user.username] = user;
    return this;
  }
}

export class MemoryAuthentication implements Authentication {

  /**
   * @internal
   * @private
   */
  public roles: string[] = [];
  /**
   * @internal
   * @private
   */
  public authorities: string[] = [];

  /**
   * @internal
   * @param username
   * @param password
   */
  private constructor(
    /**
     * @internal
     */
    public username: string,
    /**
     * @internal
     */
    public password: string,
  ) {
  }


  static with(login: string, password: string): MemoryAuthentication {
    return new MemoryAuthentication(login, password);
  }

  /**
   * Add roles to user
   * @param roles {string[]}: roles list
   */
  withRoles(...roles: string[]): MemoryAuthentication {
    this.roles = roles;
    return this;
  }

  /**
   * Add authorities to user
   * @param authorities {string[]}: authorities list
   */
  withAuthorities(...authorities: string[]): MemoryAuthentication {
    this.authorities = authorities;
    return this;
  }
}
