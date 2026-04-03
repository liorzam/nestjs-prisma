import { Global, Module } from '@nestjs/common'
import Redis from 'ioredis'
import { ConfigEnvService } from '../../config/config-env.service'
import { REDIS_CLIENT } from './redis.constants'

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigEnvService): Redis => {
        return new Redis(config.redisUrl, {
          maxRetriesPerRequest: null,
        })
      },
      inject: [ConfigEnvService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
