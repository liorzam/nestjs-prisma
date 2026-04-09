export type DependencyCheckState = 'up' | 'down'

export interface HealthDependencyCheckDto {
  status: DependencyCheckState
  /** Round-trip time for the probe in milliseconds */
  latencyMs: number
  /** Present when status is down; short reason for operators */
  error?: string
  isCritical: boolean
}

export interface HealthResponseDto {
  /** ok: all dependencies up; degraded: some down; unhealthy: all down */
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  /** Dynamic map of check name to result. Keyed by provider name (e.g., 'database', 'redis', 'kafka'). */
  checks: Record<string, HealthDependencyCheckDto>
}
