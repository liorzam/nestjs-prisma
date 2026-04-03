import type { AppEnv } from './app-env.interface'

export default (): AppEnv => ({
  nodeEnv: (process.env.NODE_ENV ?? 'development') as AppEnv['nodeEnv'],
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  // biome-ignore lint/style/noNonNullAssertion: process env
  databaseUrl: process.env.DATABASE_URL!,
  // biome-ignore lint/style/noNonNullAssertion: process env
  redisUrl: process.env.REDIS_URL!,
  trustedProxies: process.env.TRUSTED_PROXIES?.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
})
