import { Authentication } from './model/authentication';
import {
  WwwAuthenticationProvider,
  WwwOptions
} from './www-authentication.provider';
import { RequestAuthenticationImpl } from '../impl/model/request.authentication.impl';
import { Authenticator } from './authenticator';
import { RequestAuthentication } from './model/request.authentication';

export abstract class WebAuthenticationProvider extends WwwAuthenticationProvider {
  /**
   * @internal
   */
  protected constructor(
    protected authenticator: Authenticator,
    authorizationRegExp: RegExp,
    options: WwwOptions
  ) {
    super(authorizationRegExp, options);
  }

  /**
   * @internal
   * @param request
   */
  protected async buildAuthentication(
    request: any
  ): Promise<RequestAuthentication> {
    const authentication = await this.getUserAuthentication(request);
    return new RequestAuthenticationImpl(authentication);
  }

  /**
   * @internal
   * Get User from request
   * @param request
   * @private
   */
  private async getUserAuthentication(request: any): Promise<Authentication> {
    const authorization = this.getAuthorization(request);
    if (!authorization) {
      return undefined;
    }
    return this.parse(authorization, request);
  }

  /**
   * @internal
   */
  protected abstract parse(
    authorization: RegExpExecArray,
    request?: any
  ): Promise<Authentication>;
}