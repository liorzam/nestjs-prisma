import { Inject, Injectable } from '@nestjs/common'
import type Redis from 'ioredis'
import type { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants'
import type { HealthResponseDto } from './dto/health-response.dto'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getHealth(): Promise<HealthResponseDto> {
    const database = await this.checkDatabase()
    const redisStatus = await this.checkRedis()

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: { database, redis: redisStatus },
    }
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return 'up'
    } catch {
      return 'down'
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      await this.redis.ping()
      return 'up'
    } catch {
      return 'down'
    }
  }
}
