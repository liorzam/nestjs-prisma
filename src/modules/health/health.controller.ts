import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { Response } from 'express'
import type { HealthResponseDto } from './dto/health-response.dto'
import { HealthService } from './health.service'

/**
 * @module HealthModule
 * @responsibility Liveness/readiness style checks without consuming rate limit budget.
 * @entrypoints GET /health (503 when overall status is degraded or unhealthy)
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async getHealth(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResponseDto> {
    const body = await this.health.getHealth()
    if (body.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
    }
    return body
  }
}
