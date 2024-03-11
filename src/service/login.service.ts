import { loginTemplate } from '../core/utils/template.utils';
import { AuthenticationProvider } from '../core/auth/abstract/authentication.provider';
import { UserAuthenticator } from '../core/auth/abstract/user.authenticator';
import { UserAuthentication } from '../core/auth/abstract/model/user.authentication';
import { FormLogin } from '../core/auth/impl/session/form-login';
import {
  Credentials,
  CredentialsExtractor,
  RequestAuthenticationProvider
} from '../core/auth/abstract/request-authentication.provider';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export class LoginService {
  /**
   * @internal
   * @param authenticationProvider
   * @param authenticator
   * @param formLogin
   * @param credentialsExtractor
   */
  constructor(
    /**
     * @internal
     */
    private readonly authenticationProvider: AuthenticationProvider,
    /**
     * @internal
     */
    private authenticator: UserAuthenticator,
    /**
     * @internal
     */
    private formLogin: FormLogin,
    /**
     * @internal
     */
    private credentialsExtractor?: CredentialsExtractor
  ) {}

  /**
   * @internal
   * @param request
   * @param response
   */
  async loginPage(request: any, response: any) {
    const requestAuthentication =
      await this.authenticationProvider.getAuthentication(request);
    if (requestAuthentication.isAuthenticated()) {
      this.redirect(request, response);
    } else {
      let loginUrl = this.formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL;
      if (!this.formLogin.redirectUrl() && request.query.from) {
        loginUrl += '?from=' + request.query.from;
      }
      response.type('text/html');
      response.send(loginTemplate(loginUrl, request.query.error));
    }
  }

  login(request: any, response: any) {
    let credentials: Credentials = {
      username: request.body?.login,
      password: request.body?.password
    };
    if (this.credentialsExtractor) {
      credentials = this.credentialsExtractor(request);
    }
    this.authenticator
      .authenticate(credentials?.username, credentials?.password)
      .then((authentication) => {
        this.setAuthentication(request, response, authentication);
      });
  }

  logout(request: any, response: any) {
    (
      this.authenticationProvider as RequestAuthenticationProvider
    ).setAuthentication(request, response, null);
    this.redirect(request, response);
  }

  /**
   * @internal
   */
  private setAuthentication(
    request: any,
    response: any,
    authentication: UserAuthentication
  ) {
    if (!authentication) {
      this.redirect(request, response, true);
      return;
    }
    (
      this.authenticationProvider as RequestAuthenticationProvider
    ).setAuthentication(request, response, authentication);
    this.redirect(request, response);
  }

  /**
   * @internal
   */
  private redirect(request: any, response: any, error = false) {
    let redirect = '/';
    if (error) {
      redirect = this.formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE;
      let params = request.originalUrl.replace(
        this.formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL,
        ''
      );
      if (params.startsWith('?')) {
        params += '&&';
      } else {
        params += '?';
      }
      redirect += params + 'error=true';
    } else if (this.formLogin.redirectUrl()) {
      redirect = this.formLogin.redirectUrl();
    } else if (request.query?.from) {
      redirect = request.query.from as string;
    }
    response.status(302).redirect(redirect);
  }
}

/**
 * @internal
 */
export const loginServiceProvider: FactoryProvider<LoginService> = {
  provide: LoginService,
  useFactory: (
    authenticationProvider: AuthenticationProvider,
    authenticator: UserAuthenticator,
    formLogin: FormLogin,
    credentialsExtractor?: CredentialsExtractor
  ) => {
    return new LoginService(
      authenticationProvider,
      authenticator,
      formLogin,
      credentialsExtractor
    );
  },
  inject: [
    AuthenticationProvider,
    UserAuthenticator,
    FormLogin,
    {
      token: 'CREDENTIALS_EXTRACTOR',
      optional: true
    }
  ]
};
