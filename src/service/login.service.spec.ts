import { LoginService } from './login.service';
import * as template from '../core/utils/template.utils';
import { RequestAuthenticationProvider } from '../core/auth/abstract/requestAuthenticationProvider';
import { Authenticator } from '../core/auth/abstract/authenticator';
import { RequestAuthenticationImpl } from '../core/auth/impl/requestAuthenticationImpl';
import { FormLogin } from '../core/auth/impl/sessionAuthenticationProvider';

describe('LoginPageService Test', () => {

  let authenticator: Authenticator;
  let authenticationProvider: RequestAuthenticationProvider<any>;
  let loginPageService: LoginService;
  let response: any;
  let formLogin = FormLogin.new();

  beforeEach(async () => {
    authenticator = {} as Authenticator;
    authenticationProvider = {
      getAuthentication: jest.fn((request: any) => new RequestAuthenticationImpl(request.authentication)),
      setAuthentication: jest.fn(),
      credentialsExtractor: jest.fn(),
    } as unknown as RequestAuthenticationProvider<any>;
    loginPageService = new LoginService(authenticationProvider, authenticator, formLogin);
    response = {
      status: jest.fn((status: number) => response),
      redirect: jest.fn((redirect: string) => response),
      type: jest.fn(),
      send: jest.fn(),
    };
  });

  test('LoginPageService Redirect When Authenticated', () => {
    const request = {
      authentication: {
        authorities: jest.fn(() => []),
        roles: jest.fn(() => []),
      },
      query: {
        from: '/test',
      },
    };

    loginPageService.loginPage(request, response);
    expect(response.status).toHaveBeenCalledWith(302);
    expect(response.redirect).toHaveBeenCalledWith('/test');
  });

  test('LoginPageService Redirect When Not Authenticated', () => {
    const request = {
      query: {
        from: '/test',
      },
    };

    // @ts-ignore
    const spy = jest.spyOn(template, 'loginTemplate');

    const formLogin = FormLogin.new();
    loginPageService.loginPage(request, response);
    expect(spy).toHaveBeenCalledWith(`${FormLogin.DEFAULT_LOGIN_URL}?from=${request.query.from}`);
  });

  test('LoginPageService Logout', () => {
    const request = {};

    formLogin.redirectUrl('/logout');
    loginPageService.logout(request, response);
    expect(authenticationProvider.setAuthentication).toHaveBeenCalledWith(request, null);
    expect(response.status).toHaveBeenCalledWith(302);
    expect(response.redirect).toHaveBeenCalledWith('/logout');
  });
});