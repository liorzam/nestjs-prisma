import { ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'

import { ConfigEnvService } from '../config/config-env.service'

/** Passed to `helmet()` in one place so production and e2e stay aligned. */
export const appHelmetOptions = {
  crossOriginEmbedderPolicy: false,
  hidePoweredBy: true,
} as const

/**
 * Shared HTTP stack: logger, trust proxy, Helmet, global validation.
 * Used by `main.ts` and e2e after `NestFactory.create` / `createNestApplication`.
 */
export function configureHttpApp(app: NestExpressApplication): void {
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigEnvService)
  const trusted = config.trustedProxies
  if (trusted?.length) {
    const proxy = trusted.length === 1 ? trusted[0] : trusted
    app.set('trust proxy', proxy)
  }

  app.use(helmet(appHelmetOptions))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
}
