import { Global, Module, OnModuleInit } from '@nestjs/common'
import { HealthModule } from '@/modules/health/health.module'
import { HealthCheckRegistry } from '@/modules/health/services/health-check-registry'
import { DatabaseHealthCheckProvider } from './database-health-check.provider'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  imports: [HealthModule],
  providers: [PrismaService, DatabaseHealthCheckProvider],
  exports: [PrismaService],
})
export class PrismaModule implements OnModuleInit {
  constructor(
    private readonly registry: HealthCheckRegistry,
    private readonly databaseHealthCheck: DatabaseHealthCheckProvider,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.databaseHealthCheck)
  }
}
