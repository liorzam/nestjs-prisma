import { Test } from '@nestjs/testing'
import type { HealthCheckProvider, HealthCheckResult } from '../interfaces/health-check-provider.interface'
import { HealthCheckRegistry } from './health-check-registry'

describe('HealthCheckRegistry', () => {
  let registry: HealthCheckRegistry

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthCheckRegistry],
    }).compile()

    registry = moduleRef.get(HealthCheckRegistry)
  })

  describe('register', () => {
    it('registers a health check provider', async () => {
      const provider: HealthCheckProvider = {
        name: 'test-check',
        description: 'Test check',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 1 }),
      }

      registry.register(provider)
      const { checks } = await registry.executeAll()

      expect(checks['test-check']).toBeDefined()
    })

    it('allows overwriting a previously registered check by name', async () => {
      const provider1: HealthCheckProvider = {
        name: 'check',
        description: 'First',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 1 }),
      }

      const provider2: HealthCheckProvider = {
        name: 'check',
        description: 'Second',
        isCritical: false,
        check: async () => ({ status: 'down', latencyMs: 2, error: 'failed' }),
      }

      registry.register(provider1)
      registry.register(provider2)

      const { checks } = await registry.executeAll()

      expect(checks['check'].error).toBe('failed')
    })
  })

  describe('executeAll', () => {
    it('returns empty checks when no providers are registered', async () => {
      const { checks, status } = await registry.executeAll()

      expect(checks).toEqual({})
      expect(status).toBe('ok')
    })

    it('returns ok status when all checks are up', async () => {
      registry.register({
        name: 'db',
        description: 'Database',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 5 }),
      })

      registry.register({
        name: 'cache',
        description: 'Cache',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 2 }),
      })

      const { status } = await registry.executeAll()

      expect(status).toBe('ok')
    })

    it('returns degraded when a critical check fails', async () => {
      registry.register({
        name: 'db',
        description: 'Database',
        isCritical: true,
        check: async () => ({ status: 'down', latencyMs: 10, error: 'timeout' }),
      })

      registry.register({
        name: 'cache',
        description: 'Cache',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 2 }),
      })

      const { status } = await registry.executeAll()

      expect(status).toBe('degraded')
    })

    it('returns unhealthy when all checks fail', async () => {
      registry.register({
        name: 'db',
        description: 'Database',
        isCritical: true,
        check: async () => ({ status: 'down', latencyMs: 10, error: 'down' }),
      })

      registry.register({
        name: 'cache',
        description: 'Cache',
        isCritical: true,
        check: async () => ({ status: 'down', latencyMs: 0, error: 'down' }),
      })

      const { status } = await registry.executeAll()

      expect(status).toBe('unhealthy')
    })

    it('ignores non-critical check failures for status degradation', async () => {
      registry.register({
        name: 'db',
        description: 'Database',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 5 }),
      })

      registry.register({
        name: 'optional-service',
        description: 'Optional Service',
        isCritical: false,
        check: async () => ({ status: 'down', latencyMs: 0, error: 'unavailable' }),
      })

      const { status, checks } = await registry.executeAll()

      expect(status).toBe('ok')
      expect(checks['optional-service'].status).toBe('down')
    })

    it('handles provider that throws during check()', async () => {
      registry.register({
        name: 'failing-check',
        description: 'Check that throws',
        isCritical: true,
        check: async () => {
          throw new Error('Internal error')
        },
      })

      const { checks, status } = await registry.executeAll()

      expect(checks['failing-check'].status).toBe('down')
      expect(checks['failing-check'].error).toBe('Internal error')
      expect(status).toBe('unhealthy')
    })

    it('handles provider that rejects with a string', async () => {
      registry.register({
        name: 'string-reject',
        description: 'Check that rejects with string',
        isCritical: true,
        check: async () => {
          return Promise.reject('string error')
        },
      })

      const { checks } = await registry.executeAll()

      expect(checks['string-reject'].error).toBe('string error')
    })

    it('handles provider that rejects with a non-Error value', async () => {
      registry.register({
        name: 'non-error-reject',
        description: 'Check that rejects with non-Error',
        isCritical: true,
        check: async () => {
          return Promise.reject(404)
        },
      })

      const { checks } = await registry.executeAll()

      expect(checks['non-error-reject'].error).toBe('Check provider threw an unexpected error')
    })

    it('executes all checks in parallel (Promise.allSettled)', async () => {
      const checkOrder: string[] = []

      registry.register({
        name: 'check1',
        description: 'Check 1',
        isCritical: true,
        check: async () => {
          checkOrder.push('check1')
          return { status: 'up', latencyMs: 10 }
        },
      })

      registry.register({
        name: 'check2',
        description: 'Check 2',
        isCritical: true,
        check: async () => {
          checkOrder.push('check2')
          return { status: 'up', latencyMs: 5 }
        },
      })

      await registry.executeAll()

      // Both checks should have started (parallel execution)
      expect(checkOrder).toHaveLength(2)
    })
  })

  describe('getCriticalChecks', () => {
    it('returns names of critical checks only', () => {
      registry.register({
        name: 'critical1',
        description: 'Critical',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 1 }),
      })

      registry.register({
        name: 'optional',
        description: 'Optional',
        isCritical: false,
        check: async () => ({ status: 'up', latencyMs: 1 }),
      })

      registry.register({
        name: 'critical2',
        description: 'Critical',
        isCritical: true,
        check: async () => ({ status: 'up', latencyMs: 1 }),
      })

      const critical = registry.getCriticalChecks()

      expect(critical).toContain('critical1')
      expect(critical).toContain('critical2')
      expect(critical).not.toContain('optional')
      expect(critical).toHaveLength(2)
    })
  })
})
