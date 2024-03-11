import { Controller, Get, Render, Request } from '@nestjs/common';

@Controller('/custom/login/page')
export class LoginPageController {
  @Get()
  @Render('login')
  page(@Request() request: any) {
    return {
      loginUrl: '/custom/login',
      error: request.query.error
    };
  }
}
