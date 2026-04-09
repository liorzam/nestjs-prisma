import { randomUUID } from 'node:crypto'
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

import { ConfigEnvService } from '@/config/config-env.service'

type RequestWithId = Request & { id?: string }

/**
 * @responsibility Map exceptions to JSON responses; include correlation id for tracing.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor(private readonly config: ConfigEnvService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<RequestWithId>()

    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ?? request.id

    if (exception instanceof HttpException) {
      this.sendHttpException(response, request, exception, correlationId)
      return
    }

    this.sendUnknownException(response, request, exception, correlationId)
  }

  private sendHttpException(
    response: Response,
    request: RequestWithId,
    exception: HttpException,
    correlationId: string | undefined,
  ): void {
    const status = exception.getStatus()
    const rawBody = exception.getResponse()
    const normalizedBody =
      typeof rawBody === 'string' ? { message: rawBody } : (rawBody as Record<string, unknown>)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception,
          path: request.url,
          method: request.method,
          correlationId,
          requestId: request.id,
        },
        exception instanceof Error ? exception.message : 'HTTP exception',
      )
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      correlationId,
      ...normalizedBody,
    })
  }

  private sendUnknownException(
    response: Response,
    request: RequestWithId,
    exception: unknown,
    correlationId: string | undefined,
  ): void {
    const status = HttpStatus.INTERNAL_SERVER_ERROR
    const isProd = this.config.isProduction
    const errorId = randomUUID()

    this.logger.error(
      {
        err: exception,
        path: request.url,
        method: request.method,
        correlationId,
        ...(isProd ? { errorId } : {}),
      },
      exception instanceof Error ? exception.message : 'Unhandled exception',
    )

    const envelope = {
      statusCode: status,
      path: request.url,
      correlationId,
    }

    if (isProd) {
      response.status(status).json({
        ...envelope,
        errorId,
        message: 'Internal server error',
      })
      return
    }

    const err = exception instanceof Error ? exception : new Error(String(exception))
    response.status(status).json({
      ...envelope,
      message: err.message || 'Internal server error',
      error: err.name,
      ...(err.stack !== undefined ? { stack: err.stack } : {}),
    })
  }
}
