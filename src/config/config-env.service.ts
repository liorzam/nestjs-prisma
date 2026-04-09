import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppEnv } from './app-env.interface'

@Injectable()
export class ConfigEnvService {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  getOrThrow<T extends keyof AppEnv>(key: T): AppEnv[T] {
    return this.config.getOrThrow(key, { infer: true }) as AppEnv[T]
  }

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
}
