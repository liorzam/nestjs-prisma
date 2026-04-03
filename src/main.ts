import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'
import { ConfigEnvService } from './config/config-env.service'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigEnvService)
  const trusted = config.trustedProxies
  if (trusted?.length) {
    const proxy = trusted.length === 1 ? trusted[0] : trusted
    app.set('trust proxy', proxy)
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  await app.listen(config.port)
}

bootstrap().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
