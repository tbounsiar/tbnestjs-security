import { LoginService } from '../../src/service/login.service';
import { createLoginController } from '../../src/controller/login.controller';
import { FormLogin } from '../../src/core/auth/impl/session/form-login';

describe('LoginController Test', () => {
  test('LoginController Logout', () => {
    const request = {};
    const response = {};
    const formLogin = FormLogin.new();
    const loginPageService = {
      logout: jest.fn()
    } as unknown as LoginService;

    const Controller = createLoginController(formLogin);
    const controller = new Controller(loginPageService);
    controller.logout(request, response);

    expect(loginPageService.logout).toHaveBeenCalledWith(request, response);
  });
});
