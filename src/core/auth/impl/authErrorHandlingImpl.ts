import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthErrorHandling } from '../abstract/authErrorHandling';

/**
 * @internal
 */
export class AuthErrorHandlingImpl extends AuthErrorHandling {
  forbidden(message?: string): ForbiddenException {
    return new ForbiddenException(message);
  }

  unauthorized(message?: string): UnauthorizedException {
    return new UnauthorizedException(message);
  }
}
