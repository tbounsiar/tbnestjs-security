import { AuthenticationProvider } from './authenticationProvider';
import { Authentication } from './authentication';

export abstract class RequestAuthenticationProvider<Credentials> extends AuthenticationProvider {

  /**
   * @internal
   * @private
   */
  private _credentialsExtractor: CredentialsExtractor<Credentials>;

  /**
   * Set Authentication to request
   * @param request {any}: The http request
   * @param authentication {Authentication}:  the authentication
   */
  abstract setAuthentication(
    request: any,
    authentication: Authentication,
  ): void;

  credentialsExtractor(): CredentialsExtractor<Credentials>;
  credentialsExtractor(extractor: CredentialsExtractor<Credentials>): this;
  credentialsExtractor(extractor?: CredentialsExtractor<Credentials>): CredentialsExtractor<Credentials> | this {
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