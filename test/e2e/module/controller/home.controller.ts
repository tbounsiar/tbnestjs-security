import { All, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { PreAuthorize } from '../../../../src';

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

  @Get('/permission')
  permission() {
    return 'You Can Get Permission!';
  }

  @Get('/preauthorize')
  @PreAuthorize((authentication) => authentication.hasAnyRoles('ADMIN', 'USER'))
  preauthorize() {
    return 'You Can Get PreAuthorize!';
  }
}
