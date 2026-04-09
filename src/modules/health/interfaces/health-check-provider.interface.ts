/**
 * Contract for health check providers.
 * Implementations are registered with HealthCheckRegistry and executed on each /health request.
 */
export interface HealthCheckProvider {
  /** Unique identifier for this check (e.g., 'database', 'redis', 'kafka'). Used as the key in the response. */
  name: string

  /** Human-readable description of what is being checked. */
  description: string

  /**
   * Whether this check must be 'up' for overall health to be 'ok'.
   * If true, any down check makes status 'degraded'.
   * If false, down check doesn't affect overall status.
   */
  isCritical: boolean

  /** Execute the health check and return result. May throw, but preferred to return error in result. */
  check(): Promise<HealthCheckResult>
}

export interface HealthCheckResult {
  /** 'up' if the dependency is healthy, 'down' if not. */
  status: 'up' | 'down'

  /** Round-trip time for the probe in milliseconds. */
  latencyMs: number

  /** Optional error message when status is 'down'. */
  error?: string
}
