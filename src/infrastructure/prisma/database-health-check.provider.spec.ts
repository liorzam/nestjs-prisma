import { Test } from '@nestjs/testing'
import { DatabaseHealthCheckProvider } from './database-health-check.provider'
import { PrismaService } from './prisma.service'

describe('DatabaseHealthCheckProvider', () => {
  let provider: DatabaseHealthCheckProvider
  const mockQueryRaw = jest.fn()

  beforeEach(async () => {
    mockQueryRaw.mockReset()

    const moduleRef = await Test.createTestingModule({
      providers: [
        DatabaseHealthCheckProvider,
        { provide: PrismaService, useValue: { $queryRaw: mockQueryRaw } },
      ],
    }).compile()

    provider = moduleRef.get(DatabaseHealthCheckProvider)
  })

  it('has name "database"', () => {
    expect(provider.name).toBe('database')
  })

  it('has isCritical = true', () => {
    expect(provider.isCritical).toBe(true)
  })

  it('returns up status when query succeeds', async () => {
    mockQueryRaw.mockResolvedValue(undefined)

    const result = await provider.check()

    expect(result.status).toBe('up')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
    expect(result.error).toBeUndefined()
  })

  it('returns down status when query fails', async () => {
    mockQueryRaw.mockRejectedValue(new Error('connection refused'))

    const result = await provider.check()

    expect(result.status).toBe('down')
    expect(result.error).toBe('connection refused')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('includes error message when non-Error is thrown', async () => {
    mockQueryRaw.mockRejectedValue('unknown error')

    const result = await provider.check()

    expect(result.status).toBe('down')
    expect(result.error).toBe('unknown error')
  })

  it('measures latency', async () => {
    mockQueryRaw.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 10)
        }),
    )

    const result = await provider.check()

    expect(result.latencyMs).toBeGreaterThanOrEqual(10)
  })
})
