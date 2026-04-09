import { Injectable, Logger } from '@nestjs/common'
import type { HealthCheckProvider, HealthCheckResult } from '../interfaces/health-check-provider.interface'
import type { HealthDependencyCheckDto } from '../dto/health-response.dto'

/**
 * Registry for health check providers.
 * Manages registration, execution, and aggregation of health checks from all modules.
 */
@Injectable()
export class HealthCheckRegistry {
  private readonly logger = new Logger(HealthCheckRegistry.name)
  private readonly checks = new Map<string, HealthCheckProvider>()

  /**
   * Register a health check provider.
   * Checks are identified by name; registering a duplicate name overwrites the previous.
   */
  register(provider: HealthCheckProvider): void {
    this.checks.set(provider.name, provider)
    this.logger.debug(`Registered health check: ${provider.name} (critical: ${provider.isCritical})`)
  }

  /**
   * Get a list of critical check names.
   * These checks must be 'up' for overall health to be 'ok'.
   */
  getCriticalChecks(): string[] {
    return Array.from(this.checks.values())
      .filter((p) => p.isCritical)
      .map((p) => p.name)
  }

  /**
   * Execute all registered health checks in parallel and return aggregated results.
   * Each check is executed via Promise.allSettled() so failures don't block others.
   */
  async executeAll(): Promise<{
    checks: Record<string, HealthDependencyCheckDto>
    status: 'ok' | 'degraded' | 'unhealthy'
  }> {
    const entries = Array.from(this.checks.entries())

    // If no checks registered, return ok status
    if (entries.length === 0) {
      return { checks: {}, status: 'ok' }
    }

    // Execute all checks in parallel, collecting both successes and failures
    const settled = await Promise.allSettled(
      entries.map(async ([name, provider]) => {
        const result = await provider.check()
        return { name, result, provider }
      }),
    )

    // Normalize all results to DTOs
    const checks: Record<string, HealthDependencyCheckDto> = {}
    let criticalUpCount = 0
    let criticalTotal = 0

    for (let i = 0; i < settled.length; i++) {
      const settledResult = settled[i]
      const entry = entries[i]
      const checkName = entry?.[0]
      const provider = entry?.[1]

      if (!checkName || !provider) {
        continue
      }

      const healthCheckDto = this.normalizeSettledResult(settledResult, provider)
      checks[checkName] = healthCheckDto

      if (provider.isCritical) {
        criticalTotal++
        if (healthCheckDto.status === 'up') {
          criticalUpCount++
        }
      }
    }

    // Overall status follows critical checks only; non-critical downs do not degrade the headline.
    let status: 'ok' | 'degraded' | 'unhealthy'
    if (criticalTotal === 0 || criticalUpCount === criticalTotal) {
      status = 'ok'
    } else if (criticalUpCount === 0) {
      status = 'unhealthy'
    } else {
      status = 'degraded'
    }

    return { checks, status }
  }

  /**
   * Normalize a settled promise result to a HealthDependencyCheckDto.
   * Handles both successful checks and rejected checks.
   */
  private normalizeSettledResult(
    settled: PromiseSettledResult<{ name: string; result: HealthCheckResult; provider: HealthCheckProvider }>,
    provider: HealthCheckProvider,
  ): HealthDependencyCheckDto {
    if (settled.status === 'fulfilled') {
      // Successful execution: use the result directly
      return {
        status: settled.value.result.status,
        latencyMs: settled.value.result.latencyMs,
        error: settled.value.result.error,
        isCritical: provider.isCritical,
      }
    }

    // Rejected: normalize the rejection reason
    const reason = settled.reason
    return {
      status: 'down',
      latencyMs: 0,
      error:
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Check provider threw an unexpected error',
      isCritical: provider.isCritical,
    }
  }
}
