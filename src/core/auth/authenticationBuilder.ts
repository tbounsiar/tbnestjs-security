import { AuthenticationProvider } from './abstract/authenticationProvider';
import { Authenticator } from './abstract/authenticator';
import { AuthErrorHandling } from './abstract/authErrorHandling';
import { AuthErrorHandlingImpl } from './impl/authErrorHandlingImpl';
import { SecurityConfigBuilder } from '../../module/security.module';

export class AuthenticationBuilder {

  /**
   * @internal
   * @private
   */
  private _authenticationProvider: AuthenticationProvider;
  /**
   * @internal
   * @private
   */
  private _authenticator: Authenticator;
  /**
   * @internal
   * @private
   */
  private _errorHandling: AuthErrorHandling = new AuthErrorHandlingImpl();

  /**
   * @internal
   */
  constructor(
    /**
     * @internal
     * @private
     */
    private builder: SecurityConfigBuilder,
  ) {
  }

  errorHandling(): AuthErrorHandling;
  errorHandling(errorHandling: AuthErrorHandling): AuthenticationBuilder;
  errorHandling(
    errorHandling?: AuthErrorHandling,
  ): AuthErrorHandling | AuthenticationBuilder {
    if (errorHandling === undefined) {
      return this._errorHandling;
    }
    this._errorHandling = errorHandling;
    return this;
  }

  authenticationProvider(): AuthenticationProvider;
  authenticationProvider(
    authenticationProvider: AuthenticationProvider,
  ): AuthenticationBuilder;
  authenticationProvider(
    authenticationProvider?: AuthenticationProvider,
  ): AuthenticationProvider | AuthenticationBuilder {
    if (authenticationProvider === undefined) {
      return this._authenticationProvider;
    }
    this._authenticationProvider = authenticationProvider;
    return this;
  }

  authenticator(): Authenticator;
  authenticator(authenticator: Authenticator): AuthenticationBuilder;
  authenticator(
    authenticator?: Authenticator,
  ): Authenticator | AuthenticationBuilder {
    if (authenticator === undefined) {
      return this._authenticator;
    }
    this._authenticator = authenticator;
    return this;
  }

  and(): SecurityConfigBuilder {
    return this.builder;
  }
}
