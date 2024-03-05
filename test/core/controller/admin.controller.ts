import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PreAuthorize } from '../../../src/guard/decorator/preAuthorize.decorator';
import { Authentication } from '../../../src/core/auth/abstract/authenticationProvider';
import { RequestAuthentication } from '../../../src';

@Controller('/admin')
export class AdminController {

  constructor() {
  }

  @Get('/dashboard')
  dashboard(@Authentication() authentication: RequestAuthentication): string {
    return 'Welcome Dashboard!';
  }

  @Get('/list/:id')
  @PreAuthorize('$.isRequestValid(@Request()) AND $.hasOrganization(@Param("id"))')
  list(@Param('id', ParseIntPipe) id: number): string {
    return 'List for ' + id;
  }
}