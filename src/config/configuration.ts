export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  trustedProxies: process.env.TRUSTED_PROXIES?.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
})
