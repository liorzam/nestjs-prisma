import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const trusted = process.env.TRUSTED_PROXIES?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (trusted?.length) {
    const proxy = trusted.length === 1 ? (trusted[0] as string) : trusted
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

  const port = process.env.PORT ?? 3000
  await app.listen(port)
}

bootstrap().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
