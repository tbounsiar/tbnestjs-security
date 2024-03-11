import { RequestAuthentication } from './model/request.authentication';
import { createParamDecorator, Scope } from '@nestjs/common';
import { Wrapper } from '../../utils/wrapper';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { RequestAuthenticationImpl } from '../impl/model/request.authentication.impl';

/**
 * @internal
 */
export const wrapper: Wrapper<RequestAuthentication> = new Wrapper(undefined);

export const Authentication = createParamDecorator(() => {
  return wrapper.get() || new RequestAuthenticationImpl();
});

/**
 * @internal
 */
export const authenticationFactoryProvider: FactoryProvider<RequestAuthentication> =
  {
    provide: RequestAuthentication,
    useFactory: () => {
      return wrapper.get() || new RequestAuthenticationImpl();
    },
    scope: Scope.REQUEST
  };

/**
 * Interface to implement an Authentication Provider
 */
export abstract class AuthenticationProvider {
  /**
   * @internal
   * @param request
   */
  async getAuthentication(request: any): Promise<RequestAuthentication> {
    const authentication = await this.buildAuthentication(request);
    wrapper.set(authentication);
    return authentication;
  }

  /**
   * Build Authentication using request
   * @param request
   * @protected
   */
  protected abstract buildAuthentication(
    request: any
  ): Promise<RequestAuthentication>;
}

/**
 * @internal
 */
export abstract class ProviderOptions {
  abstract providerProvider(): FactoryProvider<AuthenticationProvider>;

  abstract optionProvider(): FactoryProvider<this>;
}
