import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';

/**
 * @internal
 */
export function createSecurityExceptionFilter() {
  @Catch(ForbiddenException, UnauthorizedException)
  class SecurityExceptionFilter implements ExceptionFilter {
    catch(
      exception: ForbiddenException | UnauthorizedException,
      host: ArgumentsHost
    ) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<any>();
      // @ts-ignore
      if (response.finished) {
        return;
      }
      const request = ctx.getRequest<any>();
      const status = exception.getStatus();

      response.status(status).send({
        statusCode: status,
        message: exception.message,
        url: request.url
      });
    }
  }

  return SecurityExceptionFilter;
}
