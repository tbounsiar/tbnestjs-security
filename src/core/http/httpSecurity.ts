import { RequestMethod } from '@nestjs/common';
import { AuthorizeRequests, AuthorizeRequestsBuilder } from './authorizeRequests';
import { SecurityConfigBuilder } from '../../module/security.module';
import { pathToRegex } from '../utils/utils';

export class HttpSecurity {

  /**
   * @internal
   * @private
   */
  private _authorizeRequests: AuthorizeRequests;

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

  // cors(options?: CorsOptions | CorsOptionsDelegate<any>): HttpSecurity {
  //   this.application.enableCors(options);
  //   return this;
  // }

  /**
   * @internal
   * @param path
   * @param method
   */
  getPermission(path: string, method: RequestMethod) {

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

  and(): SecurityConfigBuilder {
    return this.builder;
  }
}
