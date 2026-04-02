import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { HealthResponseDto } from './dto/health-response.dto'
import type { HealthService } from './health.service'

/**
 * @module HealthModule
 * @responsibility Liveness/readiness style checks without consuming rate limit budget.
 * @entrypoints GET /health
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthResponseDto> {
    return this.health.getHealth()
  }
}
