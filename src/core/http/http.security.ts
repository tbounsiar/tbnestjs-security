import { RequestMethod } from '@nestjs/common';
import {
  AuthorizeRequests,
  AuthorizeRequestsBuilder
} from './authorize.requests';
import { SecurityConfigBuilder } from '../../module/security.module';
import { pathToRegex } from '../utils/regex.utils';
import { CsrfTokenBuilder, CsrfToken } from './csrf.token';

export class HttpSecurity {
  /**
   * @internal
   * @private
   */
  private _authorizeRequests: AuthorizeRequests;
  /**
   * @internal
   * @private
   */
  private csrfConfig = new CsrfTokenBuilder(this);
  /**
   * @internal
   * @private
   */
  private _csrfService: CsrfToken;

  /**
   * @internal
   * @param builder
   */
  constructor(
    /**
     * @internal
     */
    private builder: SecurityConfigBuilder
  ) {}

  authorize(
    authorizeRequests: AuthorizeRequests | AuthorizeRequestsBuilder
  ): this {
    this._authorizeRequests =
      authorizeRequests instanceof AuthorizeRequests
        ? authorizeRequests
        : authorizeRequests.build();
    return this;
  }

  /**
   * @internal
   * @param path
   * @param method
   */
  getPermission(path: string, method: RequestMethod) {
    if (this._authorizeRequests) {
      let permissions: Record<number, string[]>;
      const matchers = this._authorizeRequests.matchers();
      for (const regex in matchers) {
        const pathRegex = pathToRegex(regex);
        if (pathRegex.test(path)) {
          permissions = matchers[regex];
        }
      }
      return permissions
        ? permissions[method] || permissions[RequestMethod.ALL]
        : [];
    }
    return [];
  }

  and(): SecurityConfigBuilder {
    return this.builder;
  }

  csrf() {
    return this.csrfConfig;
  }

  /**
   * @internal
   */
  csrfToken(): CsrfToken;
  /**
   * @internal
   * @param csrfService
   */
  csrfToken(csrfService: CsrfToken): this;
  /**
   * @internal
   * @param csrfService
   */
  csrfToken(csrfService?: CsrfToken): CsrfToken | this {
    if (csrfService) {
      this._csrfService = csrfService;
      return this;
    }
    return this._csrfService;
  }
}
