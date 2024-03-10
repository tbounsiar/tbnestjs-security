import {
  AuthenticationProvider,
  ProviderOptions
} from './abstract/authentication.provider';
import { AuthenticationErrorHandling } from './abstract/authentication-error.handling';
import { AuthenticationErrorHandlingImpl } from './impl/error/authentication-error.handling.impl';
import { SecurityConfigBuilder } from '../../module/security.module';
import { MemoryStore } from './impl/memory.authenticator';
import { FactoryProvider, Type } from '@nestjs/common';
import { Authenticator } from './abstract/authenticator';

type AuthenticationProviderType =
  | ProviderOptions
  | Type<AuthenticationProvider>;

type AuthenticatorType =
  | MemoryStore
  | FactoryProvider<Authenticator>
  | Type<Authenticator>;

export class AuthenticationBuilder {
  /**
   * @internal
   * @private
   */
  private _authenticationProvider: AuthenticationProviderType;
  /**
   * @internal
   * @private
   */
  private _authenticator: AuthenticatorType;
  /**
   * @internal
   * @private
   */
  private _errorHandling: AuthenticationErrorHandling =
    new AuthenticationErrorHandlingImpl();

  /**
   * @internal
   */
  constructor(
    /**
     * @internal
     * @private
     */
    private builder: SecurityConfigBuilder
  ) {}

  errorHandling(): AuthenticationErrorHandling;
  errorHandling(
    errorHandling: AuthenticationErrorHandling
  ): AuthenticationBuilder;
  errorHandling(
    errorHandling?: AuthenticationErrorHandling
  ): AuthenticationErrorHandling | AuthenticationBuilder {
    if (errorHandling === undefined) {
      return this._errorHandling;
    }
    this._errorHandling =
      errorHandling || new AuthenticationErrorHandlingImpl();
    return this;
  }

  authenticationProvider(): AuthenticationProviderType;
  authenticationProvider(
    authenticationProvider: AuthenticationProviderType
  ): this;
  authenticationProvider(
    authenticationProvider?: AuthenticationProviderType
  ): this | AuthenticationProviderType {
    if (authenticationProvider === undefined) {
      return this._authenticationProvider;
    }
    this._authenticationProvider = authenticationProvider;
    return this;
  }

  authenticator(): AuthenticatorType;
  authenticator(authenticator: AuthenticatorType): this;
  authenticator(authenticator?: AuthenticatorType): AuthenticatorType | this {
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
