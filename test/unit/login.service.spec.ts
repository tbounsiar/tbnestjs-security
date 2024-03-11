import { LoginService } from '../../src/service/login.service';
import * as template from '../../src/core/utils/template.utils';
import { RequestAuthenticationProvider } from '../../src/core/auth/abstract/request-authentication.provider';
import { Authenticator } from '../../src';
import { RequestAuthenticationImpl } from '../../src/core/auth/impl/model/request.authentication.impl';
import { FormLogin } from '../../src/core/auth/impl/session/form-login';

describe('LoginPageService Test', () => {
  let authenticator: Authenticator;
  let authenticationProvider: RequestAuthenticationProvider;
  let loginPageService: LoginService;
  let response: any;
  let formLogin = FormLogin.new();

  beforeEach(async () => {
    authenticator = {} as Authenticator;
    authenticationProvider = {
      getAuthentication: jest.fn(
        (request: any) => new RequestAuthenticationImpl(request.authentication)
      ),
      setAuthentication: jest.fn(),
      credentialsExtractor: jest.fn()
    } as unknown as RequestAuthenticationProvider;
    loginPageService = new LoginService(
      authenticationProvider,
      authenticator,
      formLogin
    );
    response = {
      status: jest.fn((status: number) => response),
      redirect: jest.fn((redirect: string) => response),
      type: jest.fn(),
      send: jest.fn()
    };
  });

  test('LoginPageService Redirect When Authenticated', async () => {
    const request = {
      authentication: {
        authorities: jest.fn(() => []),
        roles: jest.fn(() => [])
      },
      query: {
        from: '/test'
      }
    };

    await loginPageService.loginPage(request, response);
    expect(response.status).toHaveBeenCalledWith(302);
    expect(response.redirect).toHaveBeenCalledWith('/test');
  });

  test('LoginPageService Redirect When Not Authenticated', async () => {
    const request = {
      query: {
        from: '/test'
      }
    };

    // @ts-ignore
    const spy = jest.spyOn(template, 'loginTemplate');

    await loginPageService.loginPage(request, response);
    expect(spy).toHaveBeenCalledWith(
      `${FormLogin.DEFAULT_LOGIN_URL}?from=${request.query.from}`,
      undefined
    );
  });

  test('LoginPageService Logout', () => {
    const request = {};

    formLogin.redirectUrl('/logout');
    loginPageService.logout(request, response);
    expect(authenticationProvider.setAuthentication).toHaveBeenCalledWith(
      request,
      response,
      null
    );
    expect(response.status).toHaveBeenCalledWith(302);
    expect(response.redirect).toHaveBeenCalledWith('/logout');
  });
});
