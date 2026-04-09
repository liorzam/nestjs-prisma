import { randomUUID } from 'node:crypto'
import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'

import { ConfigEnvModule } from '../config/config-env.module'
import { ConfigEnvService } from '../config/config-env.service'

@Module({
  imports: [
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
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
