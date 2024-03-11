import { Controller, Post, Request, Response } from '@nestjs/common';
import { LoginService } from '@tbnestjs/security';
// import { LoginService } from '../../../../../src';

@Controller('/custom')
export class LoginController {
  constructor(private loginService: LoginService) {}

  @Post('/login')
  login(@Request() request: any, @Response() response: any) {
    this.loginService.login(request, response);
  }

  @Post('/logout')
  logout(@Request() request: any, @Response() response: any) {
    this.loginService.logout(request, response);
  }
}
