import { RequestMethod } from '@nestjs/common';
import {
  AuthorizeRequests,
  AuthorizeRequestsBuilder
} from './authorize.requests';
import { SecurityConfigBuilder } from '../../module/security.module';
import { pathToRegex } from '../utils/regex.utils';
import { CsrfTokenBuilder } from './csrf.token';
import { Permission } from './request.matcher';

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
   * @param builder
   */
  constructor(
    /**
     * @internal
     */
    private builder: SecurityConfigBuilder
  ) {}

  authorize(authorizeRequests: AuthorizeRequestsBuilder): this {
    this._authorizeRequests = authorizeRequests.build();
    return this;
  }

  /**
   * @internal
   * @param path
   * @param method
   */
  getPermission(path: string, method: RequestMethod) {
    const permissions: Permission[][] = [];
    if (this._authorizeRequests) {
      const matchers = this._authorizeRequests.matchers();
      for (const regex in matchers) {
        const pathRegex = pathToRegex(regex);
        if (pathRegex.test(path)) {
          const matcher = matchers[regex];
          permissions.push(matcher[method] || matcher[RequestMethod.ALL]);
        }
      }
    }
    return permissions;
  }

  and(): SecurityConfigBuilder {
    return this.builder;
  }

  csrf() {
    return this.csrfConfig;
  }
}
