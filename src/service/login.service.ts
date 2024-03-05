import { Injectable } from '@nestjs/common';
import { loginTemplate } from '../core/utils/template';
import { AuthenticationProvider } from '../core/auth/abstract/authenticationProvider';
import { Authenticator } from '../core/auth/abstract/authenticator';
import {
  Credentials,
  FormLogin,
  SessionAuthenticationProvider,
} from '../core/auth/impl/sessionAuthenticationProvider';
import { CredentialsExtractor } from '../core/auth/abstract/requestAuthenticationProvider';

/**
 * @internal
 */
@Injectable()
export class LoginService {

  /**
   * internal
   * @private
   */
  private readonly extractor: CredentialsExtractor<Credentials>;

  constructor(
    private authenticationProvider: AuthenticationProvider,
    private authenticator: Authenticator,
    private formLogin: FormLogin
  ) {
    this.extractor = (this.authenticationProvider as SessionAuthenticationProvider).credentialsExtractor();
  }

  loginPage(request: any, response: any) {
    const requestAuthentication =
      this.authenticationProvider.getAuthentication(request);
    if (requestAuthentication.isAuthenticated()) {
      this.redirect(request, response, this.formLogin);
    } else {
      let loginUrl = this.formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL;
      if (!this.formLogin.redirectUrl() && request.query.from) {
        loginUrl += '?from=' + request.query.from;
      }
      response.type('text/html');
      response.send(loginTemplate(loginUrl));
    }
  }

  login(request: any, response: any) {
    let credentials: Credentials = {
      username: request.body?.login,
      password: request.body?.password,
    };
    if (this.extractor) {
      credentials = this.extractor.extract(request);
    }
    const authentication = this.authenticator.authenticate(
      credentials?.username,
      credentials?.password,
    );
    (this.authenticationProvider as SessionAuthenticationProvider).setAuthentication(request, authentication);
    this.redirect(request, response, this.formLogin);
  }

  logout(request: any, response: any) {
    (this.authenticationProvider as SessionAuthenticationProvider).setAuthentication(request, null);
    this.redirect(request, response, this.formLogin);
  }

  private redirect(request: any, response: any, formLogin: FormLogin) {
    let redirect = '/';
    if (formLogin.redirectUrl()) {
      redirect = formLogin.redirectUrl();
    } else if (request.query?.from) {
      redirect = request.query.from as string;
    }
    response.status(302).redirect(redirect);
  }
}
