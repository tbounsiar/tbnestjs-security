import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';

/**
 * Interface to implement authentication error handling
 */
export abstract class AuthenticationErrorHandling {
  /**
   * Handle forbidden http error
   */
  abstract forbidden(context: ExecutionContext): ForbiddenException;

  /**
   * Handle unauthorized http error
   */
  abstract unauthorized(context: ExecutionContext): UnauthorizedException;
}
