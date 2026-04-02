import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

/**
 * @responsibility Map exceptions to JSON responses; include correlation id for tracing.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ??
      (request as Request & { id?: string }).id

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception,
          path: request.url,
          method: request.method,
          correlationId,
        },
        exception instanceof Error ? exception.message : 'Unhandled exception',
      )
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      correlationId,
      ...(typeof body === 'string' ? { message: body } : (body as object)),
    })
  }
}
