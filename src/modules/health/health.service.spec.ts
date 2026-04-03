import { Test } from '@nestjs/testing'

import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants'
import type { HealthDependencyCheckDto } from './dto/health-response.dto'
import { HealthService } from './health.service'

describe('HealthService', () => {
  let service: HealthService
  const mockQueryRaw = jest.fn()
  const mockPing = jest.fn()

  beforeEach(async () => {
    mockQueryRaw.mockReset()
    mockPing.mockReset()

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: { $queryRaw: mockQueryRaw } },
        { provide: REDIS_CLIENT, useValue: { ping: mockPing } },
      ],
    }).compile()

    service = moduleRef.get(HealthService)
  })

  it('returns ok when database and redis succeed', async () => {
    mockQueryRaw.mockResolvedValue(undefined)
    mockPing.mockResolvedValue('PONG')

    const result = await service.getHealth()
    const { timestamp, ...rest } = result

    expect(rest).toMatchInlineSnapshot(`
{
  "checks": {
    "database": {
      "latencyMs": 0,
      "status": "up",
    },
    "redis": {
      "latencyMs": 0,
      "status": "up",
    },
  },
  "status": "ok",
}
`)
    expect(Number.isNaN(Date.parse(timestamp))).toBe(false)
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
    expect(mockPing).toHaveBeenCalledTimes(1)
  })

  it('returns degraded when only database fails', async () => {
    mockQueryRaw.mockRejectedValue(new Error('connection refused'))
    mockPing.mockResolvedValue('PONG')

    const result = await service.getHealth()

    expect(result.status).toBe('degraded')
    expect(result.checks.database).toEqual({
      status: 'down',
      latencyMs: expect.any(Number) as number,
      error: 'connection refused',
    })
    expect(result.checks.redis.status).toBe('up')
  })

  it('returns degraded when only redis fails', async () => {
    mockQueryRaw.mockResolvedValue(undefined)
    mockPing.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await service.getHealth()

    expect(result.status).toBe('degraded')
    expect(result.checks.database.status).toBe('up')
    expect(result.checks.redis).toEqual({
      status: 'down',
      latencyMs: expect.any(Number) as number,
      error: 'ECONNREFUSED',
    })
  })

  it('returns unhealthy when both dependencies fail', async () => {
    mockQueryRaw.mockRejectedValue(new Error('db down'))
    mockPing.mockRejectedValue(new Error('redis down'))

    const result = await service.getHealth()

    expect(result.status).toBe('unhealthy')
    expect(result.checks.database.error).toBe('db down')
    expect(result.checks.redis.error).toBe('redis down')
  })

  it('uses Unknown error when database throws a non-Error value', async () => {
    mockQueryRaw.mockRejectedValue('not an Error')
    mockPing.mockResolvedValue('PONG')

    const result = await service.getHealth()

    expect(result.checks.database.error).toBe('Unknown error')
  })

  describe('when a check promise rejects (mergeSettledCheck)', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('still returns the other check and maps rejection to down', async () => {
      mockQueryRaw.mockResolvedValue(undefined)
      mockPing.mockResolvedValue('PONG')

      jest
        .spyOn(
          HealthService.prototype as unknown as {
            checkRedis: () => Promise<HealthDependencyCheckDto>
          },
          'checkRedis',
        )
        .mockRejectedValueOnce(new Error('probe internal failure'))

      const result = await service.getHealth()

      expect(result.checks.database.status).toBe('up')
      expect(result.checks.redis).toEqual({
        status: 'down',
        latencyMs: 0,
        error: 'probe internal failure',
      })
      expect(result.status).toBe('degraded')
    })

    it('uses string reason when rejection is a string', async () => {
      mockQueryRaw.mockResolvedValue(undefined)
      mockPing.mockResolvedValue('PONG')

      jest
        .spyOn(
          HealthService.prototype as unknown as {
            checkDatabase: () => Promise<HealthDependencyCheckDto>
          },
          'checkDatabase',
        )
        .mockRejectedValueOnce('custom failure')

      const result = await service.getHealth()

      expect(result.checks.database.error).toBe('custom failure')
      expect(result.checks.redis.status).toBe('up')
    })

    it('uses fallback message for non-Error non-string rejection', async () => {
      mockQueryRaw.mockResolvedValue(undefined)
      mockPing.mockResolvedValue('PONG')

      jest
        .spyOn(
          HealthService.prototype as unknown as {
            checkDatabase: () => Promise<HealthDependencyCheckDto>
          },
          'checkDatabase',
        )
        .mockRejectedValueOnce(404)

      const result = await service.getHealth()

      expect(result.checks.database.error).toBe('Check failed unexpectedly')
    })
  })
})
