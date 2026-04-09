import { Inject, Injectable } from '@nestjs/common'
import type Redis from 'ioredis'
import type { HealthCheckProvider, HealthCheckResult } from '@/modules/health/interfaces/health-check-provider.interface'
import { REDIS_CLIENT } from './redis.constants'

/**
 * Health check provider for Redis.
 * Performs a PING command to verify connectivity.
 * Registered with {@link HealthCheckRegistry} from {@link RedisModule} on startup.
 */
@Injectable()
export class RedisHealthCheckProvider implements HealthCheckProvider {
  name = 'redis'
  description = 'Redis cache connectivity'
  isCritical = true

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(): Promise<HealthCheckResult> {
    const started = performance.now()
    try {
      await this.redis.ping()
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
