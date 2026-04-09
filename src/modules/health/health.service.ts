import { Injectable } from '@nestjs/common'
import type { HealthResponseDto } from './dto/health-response.dto'
import { HealthCheckRegistry } from './services/health-check-registry'

/**
 * @module HealthModule
 * @responsibility Execute registered health checks and aggregate results.
 * @dependencies HealthCheckRegistry
 */
@Injectable()
export class HealthService {
  constructor(private readonly registry: HealthCheckRegistry) {}

  async getHealth(): Promise<HealthResponseDto> {
    const { checks, status } = await this.registry.executeAll()

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    }
  }
}
