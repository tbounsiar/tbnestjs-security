import { WwwOptions } from '../../abstract/www-authentication.provider';
import { AuthenticationProvider } from '../../abstract/authentication.provider';
import { JwtTokenAuthenticationProvider } from './jwt-token-authentication.provider';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export class JwtTokenOptions extends WwwOptions {
  constructor(
    private _secret: string,
    private _jwt: any
  ) {
    super();
  }

  secret(): string {
    return this._secret;
  }

  jwt(): any {
    return this._jwt;
  }

  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (options: JwtTokenOptions) => {
        return new JwtTokenAuthenticationProvider(options);
      },
      inject: [JwtTokenOptions]
    };
  }

  optionProvider(): FactoryProvider<this> {
    return {
      provide: JwtTokenOptions,
      useFactory: () => this
    };
  }
}
