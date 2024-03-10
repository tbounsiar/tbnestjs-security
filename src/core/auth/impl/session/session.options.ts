import {
  AuthenticationProvider,
  ProviderOptions
} from '../../abstract/authentication.provider';
import { FormLogin } from './form-login';
import { SessionAuthenticationProvider } from './session.authentication.provider';
import { CsrfToken } from '../../../http/csrf.token';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export class SessionOptions extends ProviderOptions {
  /**
   * @internal
   * @private
   */
  private _formLogin = FormLogin.new();
  private _csrfToken: CsrfToken;

  formLogin(): FormLogin;
  formLogin(formLogin: FormLogin): this;
  formLogin(formLogin?: FormLogin): FormLogin | this {
    if (formLogin === undefined) {
      return this._formLogin;
    }
    this._formLogin = formLogin;
    return this;
  }

  csrfToken(): CsrfToken;
  csrfToken(csrfToken: CsrfToken): this;
  csrfToken(csrfToken?: CsrfToken): CsrfToken | this {
    if (csrfToken === undefined) {
      return this._csrfToken;
    }
    this._csrfToken = csrfToken;
    return this;
  }

  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (options: SessionOptions) => {
        return new SessionAuthenticationProvider(options);
      },
      inject: [SessionOptions]
    };
  }

  optionProvider(): FactoryProvider<this> {
    return {
      provide: SessionOptions,
      useFactory: () => this
    };
  }
}
