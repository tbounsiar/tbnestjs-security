import { RequestMethod } from '@nestjs/common';

export class RequestMatcher {
  /**
   * @internal
   */
  static PERMIT_ALL = 'PERMIT_ALL';

  /**
   * @internal
   * @param _methods
   * @param _permissions
   * @param _regex
   */
  constructor(
    /**
     * @internal
     */
    private _method: RequestMethod,
    /**
     * @internal
     */
    private _permissions: string[],
    /**
     * @internal
     */
    private _regex: (string | RegExp)[]
  ) {}

  /**
   * @internal
   */
  method(): RequestMethod {
    return this._method || RequestMethod.ALL;
  }

  /**
   * @internal
   */
  regex(): (string | RegExp)[] {
    return this._regex;
  }

  /**
   * @internal
   */
  permissions(): string[] {
    return this._permissions;
  }

  static builder() {
    return new RequestMatcherBuilder();
  }
}

export class RequestMatcherBuilder {
  /**
   * @internal
   * @private
   */
  private _method: RequestMethod;
  /**
   * @internal
   * @private
   */
  private _permissions: string[] = [];
  /**
   * @internal
   * @private
   */
  private _regex: (string | RegExp)[];

  requestMatcher(...regex: (string | RegExp)[]): this {
    this._regex = regex;
    return this;
  }

  withMethod(method: RequestMethod): this {
    this._method = method;
    return this;
  }

  permitAll(): this {
    this._permissions.push(RequestMatcher.PERMIT_ALL);
    return this;
  }

  hasRole(role: string): this {
    this._permissions.push(`hasRole("${role}")`);
    return this;
  }

  hasAnyRoles(...roles: string[]): this {
    this._permissions.push(
      `hasAnyRoles(${roles.map((role) => `"${role}"`).join(', ')})`
    );
    return this;
  }

  hasAuthority(authority: string): this {
    this._permissions.push(`hasAuthority("${authority}")`);
    return this;
  }

  hasAnyAuthorities(...authorities: string[]): this {
    this._permissions.push(
      `hasAnyAuthorities(${authorities.map((authority) => `"${authority}"`).join(', ')})`
    );
    return this;
  }

  anyRequest(): this {
    this._regex = ['/(.*)'];
    return this;
  }

  build(): RequestMatcher {
    return new RequestMatcher(this._method, this._permissions, this._regex);
  }
}
