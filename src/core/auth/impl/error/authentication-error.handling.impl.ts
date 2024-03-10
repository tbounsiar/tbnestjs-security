import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';
import { AuthenticationErrorHandling } from '../../abstract/authentication-error.handling';

/**
 * @internal
 */
export class AuthenticationErrorHandlingImpl extends AuthenticationErrorHandling {
  forbidden(_: ExecutionContext): ForbiddenException {
    return new ForbiddenException();
  }

  unauthorized(_: ExecutionContext): UnauthorizedException {
    return new UnauthorizedException();
  }
}
