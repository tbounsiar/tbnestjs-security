import { RequestAuthenticationImpl } from '../model/request.authentication.impl';
import { RequestAuthenticationProvider } from '../../abstract/request-authentication.provider';
import { CsrfToken } from '../../../http/csrf.token';
import { Injectable } from '@nestjs/common';
import { SessionError } from './session.error';
import { FormLogin } from './form-login';
import { Authentication } from '../../abstract/model/authentication';
import { SessionOptions } from './session.options';

/**
 * @internal
 */
export const sessionAndFormMessage = `Your NestJS application is using session authentication. Please ensure that session support is properly configured. please see https://docs.nestjs.com/techniques/session`;

export interface Credentials {
  username: string;
  password: string;
}

@Injectable()
export class SessionAuthenticationProvider extends RequestAuthenticationProvider<Credentials> {
  private readonly _csrfToken: CsrfToken;

  constructor(options: SessionOptions) {
    super();
    this._csrfToken = options.csrfToken();
  }

  protected async buildAuthentication(
    request: any
  ): Promise<RequestAuthenticationImpl<Authentication>> {
    if (!request.session) {
      throw new SessionError(sessionAndFormMessage);
    }
    return new RequestAuthenticationImpl(request.session.authentication);
  }

  setAuthentication(
    request: any,
    response: any,
    authentication: Authentication
  ) {
    if (!request.session) {
      throw new Error(sessionAndFormMessage);
    }
    if (!authentication) {
      delete request.session.authentication;
      if (this._csrfToken) {
        this._csrfToken.delete(request, response);
      }
      return;
    }
    if (this._csrfToken) {
      this._csrfToken.create(request, response);
    }
    request.session.authentication = authentication;
  }
}
