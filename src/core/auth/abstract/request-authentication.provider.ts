import {
  AuthenticationProvider,
  ProviderOptions
} from './authentication.provider';
import { UserAuthentication } from './model/user.authentication';

/**
 * Username password object
 */
export interface Credentials {
  username: string;
  password: string;
}

export abstract class RequestAuthenticationProvider extends AuthenticationProvider {
  /**
   * Set Authentication to request
   * @param request {any}: The http request
   * @param response {any}: The http response
   * @param authentication {UserAuthentication}:  the authentication
   */
  abstract setAuthentication(
    request: any,
    response: any,
    authentication: UserAuthentication
  ): void;
}

export abstract class RequestOptions extends ProviderOptions {
  /**
   * @internal
   * @private
   */
  private _credentialsExtractor: CredentialsExtractor;

  /**
   * @internal
   */
  credentialsExtractor(): CredentialsExtractor;
  /**
   * Set Extractor to extract username and password from request
   * It used by default LoginService
   * @param extractor The credentials extractor
   */
  credentialsExtractor(extractor: CredentialsExtractor): this;
  /**
   * @internal
   * @param extractor
   */
  credentialsExtractor(
    extractor?: CredentialsExtractor
  ): CredentialsExtractor | this {
    if (extractor === undefined) {
      return this._credentialsExtractor;
    }
    this._credentialsExtractor = extractor;
    return this;
  }
}

/**
 * Anonymous function to extract login and password from
 */
export type CredentialsExtractor = (request: any) => Credentials;
