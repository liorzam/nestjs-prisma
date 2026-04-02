export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string
      NODE_ENV: 'development' | 'production' | 'test'
      DATABASE_URL: string
      REDIS_URL: string
      TRUSTED_PROXIES: string
    }
  }
}
