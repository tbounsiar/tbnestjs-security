import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

/**
 * Interface to implement authentication error handling
 */
export abstract class AuthErrorHandling {
  /**
   * Handle forbidden http error
   */
  abstract forbidden(): ForbiddenException;

  /**
   * Handle unauthorized http error
   */
  abstract unauthorized(): UnauthorizedException;
}
