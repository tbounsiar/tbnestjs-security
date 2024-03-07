import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthErrorHandling } from '../abstract/authErrorHandling';

/**
 * @internal
 */
export class AuthErrorHandlingImpl extends AuthErrorHandling {
  forbidden(_: ExecutionContext): ForbiddenException {
    return new ForbiddenException();
  }

  unauthorized(_: ExecutionContext): UnauthorizedException {
    return new UnauthorizedException();
  }
}
