import { RequestAuthentication } from './requestAuthentication';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Wrapper } from '../../utils/wrapper';

/**
 * @internal
 */
export const wrapper: Wrapper<RequestAuthentication> = new Wrapper(undefined);

export const Authentication = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    return wrapper.get();
  },
);

/**
 * Interface to implement an Authentication Provider
 */
export abstract class AuthenticationProvider {

  /**
   * @internal
   * @param _authenticateType
   */
  constructor(
    /**
     * @internal
     * @private
     */
    private _authenticateType?: AuthenticateType,
  ) {
  }

  getAuthentication(request: any): RequestAuthentication {
    const authentication = this.buildAuthentication(request);
    wrapper.set(authentication);
    return authentication;
  }

  /**
   * Build Authentication using request
   * @param request
   * @protected
   */
  protected abstract buildAuthentication(request: any): RequestAuthentication;

  /**
   * @internal
   */
  authenticateType(): AuthenticateType {
    return this._authenticateType;
  }
}

/**
 * @internal
 */
export enum AuthenticateType {
  BASIC = 'Basic',
  DIGEST = 'Digest',
  BEARER = 'Bearer',
  FORM_LOGIN = 'FORM_LOGIN',
}
