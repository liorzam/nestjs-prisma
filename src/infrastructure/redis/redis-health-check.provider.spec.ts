import { Test } from '@nestjs/testing'
import { RedisHealthCheckProvider } from './redis-health-check.provider'
import { REDIS_CLIENT } from './redis.constants'

describe('RedisHealthCheckProvider', () => {
  let provider: RedisHealthCheckProvider
  const mockPing = jest.fn()

  beforeEach(async () => {
    mockPing.mockReset()

    const moduleRef = await Test.createTestingModule({
      providers: [
        RedisHealthCheckProvider,
        { provide: REDIS_CLIENT, useValue: { ping: mockPing } },
      ],
    }).compile()

    provider = moduleRef.get(RedisHealthCheckProvider)
  })

  it('has name "redis"', () => {
    expect(provider.name).toBe('redis')
  })

  it('has isCritical = true', () => {
    expect(provider.isCritical).toBe(true)
  })

  it('returns up status when PING succeeds', async () => {
    mockPing.mockResolvedValue('PONG')

    const result = await provider.check()

    expect(result.status).toBe('up')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
    expect(result.error).toBeUndefined()
  })

  it('returns down status when PING fails', async () => {
    mockPing.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await provider.check()

    expect(result.status).toBe('down')
    expect(result.error).toBe('ECONNREFUSED')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('includes error message when non-Error is thrown', async () => {
    mockPing.mockRejectedValue('connection lost')

    const result = await provider.check()

    expect(result.status).toBe('down')
    expect(result.error).toBe('connection lost')
  })

  it('measures latency', async () => {
    mockPing.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('PONG'), 10)
        }),
    )

    const result = await provider.check()

    expect(result.latencyMs).toBeGreaterThanOrEqual(10)
  })
})
