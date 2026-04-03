import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import type Redis from 'ioredis'
import { LoggerModule } from 'nestjs-pino'
import { randomUUID } from 'node:crypto'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ConfigEnvModule } from './config/config-env.module'
import { ConfigEnvService } from './config/config-env.service'
import configuration from './config/configuration'
import { envValidationSchema } from './config/env.validation'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { REDIS_CLIENT } from './infrastructure/redis/redis.constants'
import { RedisModule } from './infrastructure/redis/redis.module'
import { AppMetadataModule } from './modules/app-metadata/app-metadata.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ConfigEnvModule,
    LoggerModule.forRootAsync({
      imports: [ConfigEnvModule],
      inject: [ConfigEnvService],
      useFactory: (config: ConfigEnvService) => {
        const isProd = config.nodeEnv === 'production'
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            genReqId: (req: { headers: Record<string, string | string[] | undefined> }) =>
              (req.headers['x-correlation-id'] as string) || randomUUID(),
            serializers: {
              req(req: { id: string; method: string; url: string }) {
                return { id: req.id, method: req.method, url: req.url }
              },
            },
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                },
          },
        }
      },
    }),
    RedisModule,
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
    PrismaModule,
    HealthModule,
    AppMetadataModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
