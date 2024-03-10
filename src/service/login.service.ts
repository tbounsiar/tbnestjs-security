import { Injectable } from '@nestjs/common';
import { loginTemplate } from '../core/utils/template.utils';
import { AuthenticationProvider } from '../core/auth/abstract/authentication.provider';
import { Authenticator } from '../core/auth/abstract/authenticator';
import { Credentials, SessionAuthenticationProvider } from '../core/auth/impl/session/session.authentication.provider';
import { Authentication } from '../core/auth/abstract/model/authentication';
import { FormLogin } from '../core/auth/impl/session/form-login';

/**
 * @internal
 */
@Injectable()
export class LoginService {

  private readonly sessionAuthenticationProvider: SessionAuthenticationProvider;

  constructor(
    authenticationProvider: AuthenticationProvider,
    private authenticator: Authenticator,
    private formLogin: FormLogin
  ) {
    this.sessionAuthenticationProvider =
      authenticationProvider as SessionAuthenticationProvider;
  }

  async loginPage(request: any, response: any) {
    const requestAuthentication =
      await this.sessionAuthenticationProvider.getAuthentication(request);

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
    if (this.sessionAuthenticationProvider.credentialsExtractor()) {
      credentials = this.sessionAuthenticationProvider
        .credentialsExtractor()
        .extract(request);
    }
    this.authenticator.authenticate(
      credentials?.username,
      credentials?.password
    ).then(authentication => {
      this.setAuthentication(request, response, authentication);
    });
  }

  logout(request: any, response: any) {
    this.sessionAuthenticationProvider.setAuthentication(
      request,
      response,
      null
    );
    this.redirect(request, response);
  }

  private setAuthentication(
    request: any,
    response: any,
    authentication: Authentication
  ) {
    if (!authentication) {
      this.redirect(request, response, true);
      return;
    }
    this.sessionAuthenticationProvider.setAuthentication(
      request,
      response,
      authentication
    );
    this.redirect(request, response);
  }

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
