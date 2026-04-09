import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AppLoggerModule } from './common/app-logger.module'
import { AppThrottlerModule } from './common/app-throttler.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { AppNestConfigModule } from './config/app-nest-config.module'
import { ConfigEnvModule } from './config/config-env.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { RedisModule } from './infrastructure/redis/redis.module'
import { AppMetadataModule } from './modules/app-metadata/app-metadata.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    AppNestConfigModule,
    ConfigEnvModule,
    AppLoggerModule,
    RedisModule,
    AppThrottlerModule,
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
