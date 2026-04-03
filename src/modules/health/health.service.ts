import { Inject, Injectable } from '@nestjs/common'
import type Redis from 'ioredis'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants'
import type {
  HealthDependencyCheckDto,
  HealthResponseDto,
} from './dto/health-response.dto'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getHealth(): Promise<HealthResponseDto> {
    const [dbSettled, redisSettled] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ])
    const database = this.mergeSettledCheck(dbSettled)
    const redisStatus = this.mergeSettledCheck(redisSettled)

    const upCount = [database, redisStatus].filter((c) => c.status === 'up')
      .length
    const overall: HealthResponseDto['status'] =
      upCount === 2 ? 'ok' : upCount === 0 ? 'unhealthy' : 'degraded'

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      checks: { database, redis: redisStatus },
    }
  }

  private mergeSettledCheck(
    settled: PromiseSettledResult<HealthDependencyCheckDto>,
  ): HealthDependencyCheckDto {
    if (settled.status === 'fulfilled') {
      return settled.value
    }
    const reason = settled.reason

    return {
      status: 'down',
      latencyMs: 0,
      error:
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Check failed unexpectedly',
    }
  }

  private async checkDatabase(): Promise<HealthDependencyCheckDto> {
    const started = performance.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: 'up',
        latencyMs: Math.round(performance.now() - started),
      }
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Math.round(performance.now() - started),
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  private async checkRedis(): Promise<HealthDependencyCheckDto> {
    const started = performance.now()
    try {
      await this.redis.ping()
      return {
        status: 'up',
        latencyMs: Math.round(performance.now() - started),
      }
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Math.round(performance.now() - started),
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }
}
