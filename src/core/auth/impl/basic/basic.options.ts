import { WwwOptions } from '../../abstract/www-authentication.provider';
import { AuthenticationProvider } from '../../abstract/authentication.provider';
import { BasicWebAuthenticationProvider } from './basic-web-authentication.provider';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { UserAuthenticator } from '../../abstract/user.authenticator';

export class BasicOptions extends WwwOptions {
  /**
   * @internal
   * @private
   */
  private _charset: BufferEncoding = 'utf-8';

  /**
   * @internal
   */
  charset(): BufferEncoding;

  charset(charset: BufferEncoding): this;
  /**
   * Set WWW-Authenticate Digest charset
   * @param charset {BufferEncoding}: charset value
   */
  charset(charset?: BufferEncoding): this | BufferEncoding {
    if (charset === undefined) {
      return this._charset;
    }
    this._charset = charset || 'utf-8';
    return this;
  }

  /**
   * @internal
   */
  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (authenticator: UserAuthenticator, options: BasicOptions) => {
        return new BasicWebAuthenticationProvider(authenticator, options);
      },
      inject: [UserAuthenticator, BasicOptions]
    };
  }

  /**
   * @internal
   */
  optionProvider(): FactoryProvider<this> {
    return {
      provide: BasicOptions,
      useFactory: () => this
    };
  }
}
