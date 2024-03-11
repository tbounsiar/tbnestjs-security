import { AuthenticationProvider } from '../../abstract/authentication.provider';
import { FormLogin } from './form-login';
import { SessionAuthenticationProvider } from './session.authentication.provider';
import { CsrfToken } from '../../../http/csrf.token';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { RequestOptions } from '../../abstract/request-authentication.provider';

/**
 * Session authentication options
 */
export class SessionOptions extends RequestOptions {
  /**
   * @internal
   * @private
   */
  private _formLogin = FormLogin.new();

  /**
   * @internal
   */
  formLogin(): FormLogin;
  formLogin(formLogin: FormLogin): this;
  formLogin(formLogin?: FormLogin): FormLogin | this {
    if (formLogin === undefined) {
      return this._formLogin;
    }
    this._formLogin = formLogin;
    return this;
  }

  /**
   * @internal
   */
  providerProvider(): FactoryProvider<AuthenticationProvider> {
    return {
      provide: AuthenticationProvider,
      useFactory: (token?: CsrfToken) => {
        return new SessionAuthenticationProvider(token);
      },
      inject: [{ token: CsrfToken, optional: true }]
    };
  }

  /**
   * @internal
   */
  optionProvider(): FactoryProvider<this> {
    return {
      provide: SessionOptions,
      useFactory: () => this
    };
  }
}
