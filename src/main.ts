import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from '@/app.module'
import { configureHttpApp } from '@/common/configure-http-app'
import { ConfigEnvService } from '@/config/config-env.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })

  configureHttpApp(app)
  
  const config = app.get(ConfigEnvService)
  await app.listen(config.port)
}

bootstrap().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
