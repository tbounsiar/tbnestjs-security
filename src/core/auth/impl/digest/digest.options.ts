import { WwwOptions } from '../../abstract/www-authentication.provider';
import { AuthenticationProvider } from '../../abstract/authentication.provider';
import { DigestWebAuthenticationProvider } from './digest-web-authentication.provider';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { UserAuthenticator } from '../../abstract/user.authenticator';

export type DigestAlgorithm = 'MD5' | 'MD5-sess';

export class DigestOptions extends WwwOptions {
  /**
   * @internal
   * @private
   */
  private _domain: string;
  /**
   * @internal
   * @private
   */
  private _opaque = false;
  /**
   * @internal
   * @private
   */
  private _algorithm: DigestAlgorithm;
  /**
   * @internal
   * @private
   */
  private _qop = false;

  /**
   * Activate WWW-Authenticate Digest opaque
   */
  opaque(): this {
    this._opaque = true;
    return this;
  }

  /**
   * @internal
   */
  isOpaque() {
    return this._opaque;
  }

  /**
   * @internal
   */
  domain(): string;

  domain(domain: string): this;
  /**
   * Set WWW-Authenticate Digest domain
   * @param domain {string}: domain value
   */
  domain(domain?: string): this | string {
    if (domain === undefined) {
      return this._domain;
    }
    this._domain = domain;
    return this;
  }

  /**
   * @internal
   */
  algorithm(): DigestAlgorithm;
  algorithm(algorithm: DigestAlgorithm): this;
  /**
   * Set WWW-Authenticate Digest algorithm
   * @param algorithm {DigestAlgorithm}: algorithm value
   */
  algorithm(algorithm?: DigestAlgorithm): this | DigestAlgorithm {
    if (algorithm === undefined) {
      return this._algorithm;
    }
    this._algorithm = algorithm;
    return this;
  }

  /**
   * Set WWW-Authenticate Digest qop 'auth'
   */
  qop(): this {
    this._qop = true;
    return this;
  }

  /**
   * @internal
   */
  isQop() {
    return this._qop;
  }

  /**
   * @internal
   */
  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (
        authenticator: UserAuthenticator,
        options: DigestOptions
      ) => {
        return new DigestWebAuthenticationProvider(authenticator, options);
      },
      inject: [UserAuthenticator, DigestOptions]
    };
  }

  /**
   * @internal
   */
  optionProvider(): FactoryProvider<this> {
    return {
      provide: DigestOptions,
      useFactory: () => this
    };
  }
}
