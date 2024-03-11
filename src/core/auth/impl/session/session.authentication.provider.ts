import { RequestAuthenticationImpl } from '../model/request.authentication.impl';
import { RequestAuthenticationProvider } from '../../abstract/request-authentication.provider';
import { CsrfToken } from '../../../http/csrf.token';
import { SessionError } from './session.error';
import { UserAuthentication } from '../../abstract/model/user.authentication';

/**
 * @internal
 */
export const sessionAndFormMessage = `Your NestJS application is using session authentication. Please ensure that session support is properly configured. please see https://docs.nestjs.com/techniques/session`;

/**
 * @internal
 */
export class SessionAuthenticationProvider extends RequestAuthenticationProvider {
  constructor(private readonly csrfToken?: CsrfToken) {
    super();
  }

  protected async buildAuthentication(
    request: any
  ): Promise<RequestAuthenticationImpl<UserAuthentication>> {
    if (!request.session) {
      throw new SessionError(sessionAndFormMessage);
    }
    return new RequestAuthenticationImpl(request.session.authentication);
  }

  setAuthentication(
    request: any,
    response: any,
    authentication: UserAuthentication
  ) {
    if (!request.session) {
      throw new Error(sessionAndFormMessage);
    }
    if (!authentication) {
      delete request.session.authentication;
      if (this.csrfToken) {
        this.csrfToken.delete(request, response);
      }
      return;
    }
    if (this.csrfToken) {
      this.csrfToken.create(request, response);
    }
    request.session.authentication = authentication;
  }
}
