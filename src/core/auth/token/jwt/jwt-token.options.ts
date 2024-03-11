import { WwwOptions } from '../../abstract/www-authentication.provider';
import { AuthenticationProvider } from '../../abstract/authentication.provider';
import { JwtTokenAuthenticationProvider } from './jwt-token-authentication.provider';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { TokenParser } from '../iface/token.parser';

/**
 * Jwt Authentication Settings Options
 */
export class JwtTokenOptions extends WwwOptions {
  /**
   * @internal
   * @private
   */
  private _tokenParser: TokenParser;
  /**
   * @internal
   * @private
   */
  private _secret: string;

  secret(secret: string): this;
  /**
   * @internal
   */
  secret(): string;
  secret(secret?: string): this | string {
    if (secret === undefined) {
      return this._secret;
    }
    this._secret = secret;
    return this;
  }

  tokenParser(tokenParser: TokenParser): this;
  /**
   * @internal
   */
  tokenParser(): TokenParser;
  tokenParser(tokenParser?: TokenParser): this | TokenParser {
    if (tokenParser === undefined) {
      return this._tokenParser;
    }
    this._tokenParser = tokenParser;
    return this;
  }

  /**
   * @internal
   */
  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (options: JwtTokenOptions) => {
        return new JwtTokenAuthenticationProvider(options);
      },
      inject: [JwtTokenOptions]
    };
  }

  /**
   * @internal
   */
  optionProvider(): FactoryProvider<this> {
    return {
      provide: JwtTokenOptions,
      useFactory: () => this
    };
  }
}
