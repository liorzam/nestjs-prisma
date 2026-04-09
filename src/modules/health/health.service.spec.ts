import { Test } from '@nestjs/testing'
import { HealthCheckRegistry } from './services/health-check-registry'
import { HealthService } from './health.service'

describe('HealthService', () => {
  let service: HealthService
  let registry: HealthCheckRegistry

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckRegistry,
          useValue: {
            executeAll: jest.fn(),
          },
        },
      ],
    }).compile()

    service = moduleRef.get(HealthService)
    registry = moduleRef.get(HealthCheckRegistry)
  })

  it('calls registry.executeAll() and returns formatted response', async () => {
    const mockResult = {
      checks: {
        database: { status: 'up' as const, latencyMs: 5 },
        redis: { status: 'up' as const, latencyMs: 2 },
      },
      status: 'ok' as const,
    }
    ;(registry.executeAll as jest.Mock).mockResolvedValue(mockResult)

    const result = await service.getHealth()

    expect(result.status).toBe('ok')
    expect(result.checks).toEqual(mockResult.checks)
    expect(result.timestamp).toBeDefined()
    expect((registry.executeAll as jest.Mock)).toHaveBeenCalledTimes(1)
  })

  it('includes timestamp in ISO format', async () => {
    ;(registry.executeAll as jest.Mock).mockResolvedValue({
      checks: {},
      status: 'ok',
    })

    const result = await service.getHealth()

    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false)
  })

  it('passes through status and checks from registry without modification', async () => {
    const mockResult = {
      checks: {
        database: { status: 'down' as const, latencyMs: 10, error: 'connection refused' },
        redis: { status: 'up' as const, latencyMs: 1 },
      },
      status: 'degraded' as const,
    }
    ;(registry.executeAll as jest.Mock).mockResolvedValue(mockResult)

    const result = await service.getHealth()

    expect(result.status).toBe('degraded')
    expect(result.checks.database.error).toBe('connection refused')
  })
})
