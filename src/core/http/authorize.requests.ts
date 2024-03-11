import { Permission, RequestMatcher } from './request.matcher';

export class AuthorizeRequests {
  /**
   * @internal
   */
  private permissions: Record<string, Record<number, Permission[]>> = {};

  /**
   * @internal
   * @param requestMatchers
   */
  constructor(requestMatchers: RequestMatcher[]) {
    requestMatchers.forEach((requestMatcher) => {
      requestMatcher.regex().forEach((regex) => {
        const key = regex instanceof RegExp ? regex.source : regex;
        if (this.permissions[key]) {
          if (this.permissions[key][requestMatcher.method()]) {
            this.permissions[key][requestMatcher.method()].push(
              ...requestMatcher.permissions()
            );
          } else {
            this.permissions[key][requestMatcher.method()] =
              requestMatcher.permissions();
          }
        } else {
          this.permissions[key] = {
            [requestMatcher.method()]: requestMatcher.permissions()
          };
        }
      });
    });
  }

  matchers(): Record<string, Record<number, Permission[]>> {
    return this.permissions || {};
  }

  static with(): AuthorizeRequestsBuilder {
    return new AuthorizeRequestsBuilder();
  }
}

export class AuthorizeRequestsBuilder {
  /**
   * @internal
   * @private
   */
  private requestMatchers: RequestMatcher[] = [];

  requestMatcher(requestMatchers: RequestMatcher): this {
    this.requestMatchers.push(requestMatchers);
    return this;
  }

  /**
   * @internal
   */
  build(): AuthorizeRequests {
    return new AuthorizeRequests(this.requestMatchers);
  }
}
