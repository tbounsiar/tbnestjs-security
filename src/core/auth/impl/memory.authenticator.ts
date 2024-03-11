import { Authenticator } from '../abstract/authenticator';
import { Authentication } from '../abstract/model/authentication';

/**
 * @internal
 */
export class MemoryAuthenticator extends Authenticator {
  /**
   * @param options
   */
  constructor(private options: MemoryStore) {
    super();
  }

  /**
   * @internal
   * @param login
   * @param password
   */
  async authenticate(
    login: string,
    password?: string
  ): Promise<MemoryAuthentication> {
    return this.options.getUser(login, password);
  }
}

/**
 * Memory authenticator store
 */
export class MemoryStore {
  /**
   * @internal
   * @private
   */
  private store: Record<string, MemoryAuthentication> = {};

  /**
   * Add new User
   * @param user {MemoryAuthentication}: user
   */
  addUser(user: MemoryAuthentication): this {
    this.store[user.username] = user;
    return this;
  }

  /**
   * @internal
   * @param login
   * @param password
   */
  getUser(login: string, password?: string) {
    if (login) {
      const user = this.store[login];
      if (user && (!password || user.password === password)) {
        return user;
      }
    }
    return undefined;
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
    public password: string
  ) {}

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
