import { AuthenticationProvider } from './authentication.provider';
import { Authentication } from './model/authentication';

export abstract class RequestAuthenticationProvider<
  C
> extends AuthenticationProvider {
  /**
   * @internal
   * @private
   */
  private _credentialsExtractor: CredentialsExtractor<C>;

  /**
   * Set Authentication to request
   * @param request {any}: The http request
   * @param authentication {Authentication}:  the authentication
   */
  abstract setAuthentication(
    request: any,
    response: any,
    authentication: Authentication
  ): void;

  credentialsExtractor(): CredentialsExtractor<C>;
  credentialsExtractor(extractor: CredentialsExtractor<C>): this;
  credentialsExtractor(
    extractor?: CredentialsExtractor<C>
  ): CredentialsExtractor<C> | this {
    if (extractor === undefined) {
      return this._credentialsExtractor;
    }
    this._credentialsExtractor = extractor;
    return this;
  }
}

export interface CredentialsExtractor<Credentials> {
  extract(request: any): Credentials;
}
