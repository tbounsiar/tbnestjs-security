import { Controller, Get, Request, Type } from '@nestjs/common';
import { CsrfTokenBuilder, CsrfToken } from '../core/http/csrf.token';

/**
 * @internal
 */
export const createCsrfController = (csrf: CsrfTokenBuilder): Type<any> => {
  @Controller()
  class CsrfController {
    constructor(private csrfService: CsrfToken) {}

    @Get(csrf.url())
    token(@Request() request: any) {
      return this.csrfService.getToken(request);
    }
  }

  return CsrfController;
};
