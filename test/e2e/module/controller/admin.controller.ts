import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PreAuthorize } from '../../../../src/guard/decorator/pre-authorize.decorator';

@Controller('/admin')
export class AdminController {
  @Get('/dashboard')
  dashboard(): string {
    return 'Welcome Dashboard!';
  }

  @Get('/list/:id')
  @PreAuthorize(
    '$.isRequestValid(@Request()) AND $.hasOrganization(@Param("id"))'
  )
  list(@Param('id', ParseIntPipe) id: number): string {
    return 'List for ' + id;
  }
}
