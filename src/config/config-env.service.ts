import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppEnv } from './app-env.interface'

@Injectable()
export class ConfigEnvService {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  get nodeEnv(): AppEnv['nodeEnv'] {
    return this.config.getOrThrow('nodeEnv', { infer: true })
  }

  get port(): number {
    return this.config.getOrThrow('port', { infer: true })
  }

  get databaseUrl(): string {
    return this.config.getOrThrow('databaseUrl', { infer: true })
  }

  get redisUrl(): string {
    return this.config.getOrThrow('redisUrl', { infer: true })
  }

  get trustedProxies(): AppEnv['trustedProxies'] {
    return this.config.get('trustedProxies', { infer: true })
  }

  /** Immutable snapshot of all typed env-backed config */
  getAll(): Readonly<AppEnv> {
    return {
      nodeEnv: this.nodeEnv,
      port: this.port,
      databaseUrl: this.databaseUrl,
      redisUrl: this.redisUrl,
      trustedProxies: this.trustedProxies,
    }
  }
}
