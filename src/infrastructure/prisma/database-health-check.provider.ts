import { Injectable } from '@nestjs/common'
import type { HealthCheckProvider, HealthCheckResult } from '@/modules/health/interfaces/health-check-provider.interface'
import { PrismaService } from './prisma.service'

/**
 * Health check provider for PostgreSQL database via Prisma.
 * Performs a simple SELECT 1 query to verify connectivity.
 * Registered with {@link HealthCheckRegistry} from {@link PrismaModule} on startup.
 */
@Injectable()
export class DatabaseHealthCheckProvider implements HealthCheckProvider {
  name = 'database'
  description = 'PostgreSQL database connectivity'
  isCritical = true

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const started = performance.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: 'up',
        latencyMs: Math.round(performance.now() - started),
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
      return {
        status: 'down',
        latencyMs: Math.round(performance.now() - started),
        error: errorMsg,
      }
    }
  }
}
