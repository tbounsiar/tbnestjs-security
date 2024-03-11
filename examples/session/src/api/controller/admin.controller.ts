import { Controller, Get } from '@nestjs/common';

@Controller('/admin')
export class AdminController {
  @Get('/home')
  getHello(): string {
    return 'ADMIN HOME';
  }
}
