import { All, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PreAuthorize } from '../../../src/guard/decorator/preAuthorize.decorator';

@Controller()
export class HomeController {

  @Get()
  index(): string {
    return 'Welcome Home!';
  }
  @Get('/permit')
  permit(): string {
    return 'Welcome Permit!';
  }

  @All('/home')
  home(): string {
    return 'Welcome Home!';
  }

  @Post('/create')
  @PreAuthorize('$.hasRole("ADMIN") OR $.hasAuthority("CREATE")')
  @HttpCode(200)
  create(): string {
    return 'You Can Create!';
  }
}
