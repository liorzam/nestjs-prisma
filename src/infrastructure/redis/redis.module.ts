import { Global, Module, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'
import { ConfigEnvService } from '@/config/config-env.service'
import { HealthModule } from '@/modules/health/health.module'
import { HealthCheckRegistry } from '@/modules/health/services/health-check-registry'
import { RedisHealthCheckProvider } from './redis-health-check.provider'
import { REDIS_CLIENT } from './redis.constants'

@Global()
@Module({
  imports: [HealthModule],
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
    RedisHealthCheckProvider,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleInit {
  constructor(
    private readonly registry: HealthCheckRegistry,
    private readonly redisHealthCheck: RedisHealthCheckProvider,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.redisHealthCheck)
  }
}
