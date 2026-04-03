export type NodeEnv = 'development' | 'production' | 'test'

/**
 * Application config derived from environment (Joi-validated + `configuration()`).
 * Keys match the object returned by `src/config/configuration.ts`.
 */
export interface AppEnv {
  nodeEnv: NodeEnv
  port: number
  databaseUrl: string
  redisUrl: string
  /** Parsed from `TRUSTED_PROXIES` (comma-separated); undefined when unset or empty */
  trustedProxies: string[] | undefined
}
