import { RequestMethod } from '@nestjs/common';
import { RequestAuthentication } from '../auth/abstract/model/request.authentication';

export class RequestMatcher {
  /**
   * @internal
   */
  static PERMIT_ALL = () => true;
  /**
   * @internal
   */
  private _method: RequestMethod = RequestMethod.ALL;
  /**
   * @internal
   */
  private _permissions: Permission[] = [];

  /**
   * @internal
   * @param _method
   * @param _permissions
   * @param _regex
   */
  private constructor(
    /**
     * @internal
     */
    private _regex: (string | RegExp)[]
  ) {}

  static match(...regex: (string | RegExp)[]): RequestMatcher {
    return new this(regex);
  }

  static anyRequest(): RequestMatcher {
    return new this(['/(.*)']);
  }

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
  permissions(): Permission[] {
    return this._permissions;
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
    this._permissions.push(`$.hasRole("${role}")`);
    return this;
  }

  hasAnyRoles(...roles: string[]): this {
    this._permissions.push(
      `$.hasAnyRoles(${roles.map((role) => `"${role}"`).join(', ')})`
    );
    return this;
  }

  hasAuthority(authority: string): this {
    this._permissions.push(`$.hasAuthority("${authority}")`);
    return this;
  }

  hasAnyAuthorities(...authorities: string[]): this {
    this._permissions.push(
      `$.hasAnyAuthorities(${authorities.map((authority) => `"${authority}"`).join(', ')})`
    );
    return this;
  }

  hasPermission(permission: Permission): this {
    this._permissions.push(permission);
    return this;
  }
}

export type PermissionFunction = (
  authentication: RequestAuthentication,
  request?: any
) => boolean;

export type Permission = string | PermissionFunction;
