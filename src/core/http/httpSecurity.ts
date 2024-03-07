import { RequestMethod } from '@nestjs/common';
import { AuthorizeRequests, AuthorizeRequestsBuilder } from './authorizeRequests';
import { SecurityConfigBuilder } from '../../module/security.module';
import { pathToRegex } from '../utils/regex.utils';
import { CsrfBuilder } from './csrf.service';

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
  private csrfConfig= new CsrfBuilder(this);

  /**
   * @internal
   * @param builder
   */
  constructor(
    /**
     * @internal
     */
    private builder: SecurityConfigBuilder,
  ) {
  }

  authorize(authorizeRequests: AuthorizeRequests | AuthorizeRequestsBuilder): this {
    this._authorizeRequests = authorizeRequests instanceof AuthorizeRequests ? authorizeRequests : authorizeRequests.build();
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
      for (let regex in matchers) {
        const pathRegex = pathToRegex(regex);
        if (pathRegex.test(path)) {
          permissions = matchers[regex];
        }
      }
      return permissions ? permissions[method] || permissions[RequestMethod.ALL] : [];
    }
    return [];
  }

  and(): SecurityConfigBuilder {
    return this.builder;
  }

  /**
   * @internal
   */
  csrf() {
    return this.csrfConfig;
  }
}
