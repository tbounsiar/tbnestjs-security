import { RequestMatcher, RequestMatcherBuilder } from './request.matcher';

export class AuthorizeRequests {
  /**
   * @internal
   */
  private permissions: Record<string, Record<number, string[]>> = {};

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

  static builder(): AuthorizeRequestsBuilder {
    return new AuthorizeRequestsBuilder();
  }

  matchers(): Record<string, Record<number, string[]>> {
    return this.permissions || {};
  }
}

export class AuthorizeRequestsBuilder {
  /**
   * @internal
   * @private
   */
  private requestMatchers: RequestMatcher[] = [];

  requestMatcher(
    requestMatchers: RequestMatcher | RequestMatcherBuilder
  ): this {
    this.requestMatchers.push(
      requestMatchers instanceof RequestMatcher
        ? requestMatchers
        : requestMatchers.build()
    );
    return this;
  }

  build(): AuthorizeRequests {
    return new AuthorizeRequests(this.requestMatchers);
  }
}
