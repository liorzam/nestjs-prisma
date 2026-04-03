export type DependencyCheckState = 'up' | 'down'

export interface HealthDependencyCheckDto {
  status: DependencyCheckState
  /** Round-trip time for the probe in milliseconds */
  latencyMs: number
  /** Present when status is down; short reason for operators */
  error?: string
}

export interface HealthResponseDto {
  /** ok: all dependencies up; degraded: some down; unhealthy: all down */
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: HealthDependencyCheckDto
    redis: HealthDependencyCheckDto
  }
}
