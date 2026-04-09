import { Module } from '@nestjs/common'
import { HealthCheckRegistry } from './services/health-check-registry'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

/**
 * Health module provides liveness/readiness checks via GET /health.
 * Other modules can inject HealthCheckRegistry and register their own checks.
 * Database and Redis probes are registered from {@link PrismaModule} and {@link RedisModule} when those modules load.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthCheckRegistry],
  exports: [HealthCheckRegistry],
})
export class HealthModule {}
