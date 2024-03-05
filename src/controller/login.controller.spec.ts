import { LoginService } from '../service/login.service';
import { createLoginController } from './login.controller';
import { FormLogin } from '../core/auth/impl/sessionAuthenticationProvider';

describe('LoginController Test', () => {

  test('LoginController Logout', () => {
    const request = {};
    const response = {};
    const formLogin = FormLogin.new();
    const loginPageService = {
      logout: jest.fn(),
    } as unknown as LoginService;

    const Controller = createLoginController(formLogin);
    const controller = new Controller(loginPageService);
    controller.logout(request, response);

    expect(loginPageService.logout).toHaveBeenCalledWith(request, response);
  });
});