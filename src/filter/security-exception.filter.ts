import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException, UnauthorizedException } from '@nestjs/common';

/**
 * @internal
 */
export function createSecurityExceptionFilter() {
  @Catch(ForbiddenException, UnauthorizedException)
  class SecurityExceptionFilter implements ExceptionFilter {
    catch(exception: ForbiddenException | UnauthorizedException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      // @ts-ignore
      if (response.finished) {
        return
      }
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();

      response
        // @ts-ignore
        .status(status)
        .json({
          statusCode: status,
          message: exception.message,
          url: request.url,
        });
    }

  }

  return SecurityExceptionFilter;
}