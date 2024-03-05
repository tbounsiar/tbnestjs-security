import { AuthenticateType } from '../abstract/authenticationProvider';
import { RequestAuthentication } from '../abstract/requestAuthentication';
import { Authentication } from '../abstract/authentication';
import { WWWAuthenticationProvider } from './wwwAuthenticationProvider';
import { RequestAuthenticationImpl } from './requestAuthenticationImpl';
import { AuthenticationBuilder } from '../authenticationBuilder';


export abstract class WebAuthenticationProvider extends WWWAuthenticationProvider {
  /**
   * @internal
   */
  protected constructor(
    authType: AuthenticateType,
    authorizationRegExp: RegExp,
    /**
     * @internal
     */
    protected authenticationBuilder: AuthenticationBuilder
  ) {
    super(authType, authorizationRegExp);
  }

  /**
   * @internal
   * @param request
   */
  protected buildAuthentication(request: any): RequestAuthentication {
    const authentication = this.getUserAuthentication(request);
    return new RequestAuthenticationImpl(authentication);
  }

  /**
   * @internal
   * Get User from request
   * @param request
   * @private
   */
  private getUserAuthentication(request: any): Authentication {
    const authorization = this.getAuthorization(request);
    if (!authorization) {
      return undefined;
    }
    return this.parse(authorization, request);
  }

  /**
   * @internal
   */
  protected abstract parse(authorization: RegExpExecArray, request?: any): Authentication;
}