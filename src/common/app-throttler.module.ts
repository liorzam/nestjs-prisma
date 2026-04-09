import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import type Redis from 'ioredis'

import { REDIS_CLIENT } from '../infrastructure/redis/redis.constants'
import { RedisModule } from '../infrastructure/redis/redis.module'

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60_000,
            limit: 100,
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
