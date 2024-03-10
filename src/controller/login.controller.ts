import { Controller, Get, Post, Request, Response, Type } from '@nestjs/common';
import { LoginService } from '../service/login.service';
import { FormLogin } from '../core/auth/impl/session/form-login';

/**
 * @internal
 * @param formLogin
 */
export const createLoginController = (formLogin: FormLogin): Type<any> => {
  @Controller()
  class LoginController {
    constructor(private loginService: LoginService) {}

    @Get(formLogin.loginPage() || FormLogin.DEFAULT_LOGIN_PAGE)
    async page(@Request() request: any, @Response() response: any) {
      await this.loginService.loginPage(request, response);
    }

    @Post(formLogin.loginUrl() || FormLogin.DEFAULT_LOGIN_URL)
    login(@Request() request: any, @Response() response: any) {
      this.loginService.login(request, response);
    }

    @Post(formLogin.logoutUrl() || FormLogin.DEFAULT_LOGOUT_URL)
    logout(@Request() request: any, @Response() response: any) {
      this.loginService.logout(request, response);
    }
  }

  return LoginController;
};
