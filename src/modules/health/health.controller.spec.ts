import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

describe('HealthController', () => {
  let app: INestApplication
  let getHealth: jest.Mock

  const sampleOkBody = {
    status: 'ok' as const,
    timestamp: '2026-04-03T12:00:00.000Z',
    checks: {
      database: { status: 'up' as const, latencyMs: 2 },
      redis: { status: 'up' as const, latencyMs: 1 } as Record<string, unknown>,
    } as Record<string, unknown>,
  }

  beforeEach(async () => {
    getHealth = jest.fn()

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: { getHealth } }],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('GET /health returns 200 and body when service reports ok', async () => {
    getHealth.mockResolvedValue(sampleOkBody)

    const res = await request(app.getHttpServer()).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(sampleOkBody)
    expect(getHealth).toHaveBeenCalledTimes(1)
  })

  it('GET /health returns 503 when service reports degraded', async () => {
    getHealth.mockResolvedValue({
      ...sampleOkBody,
      status: 'degraded',
      checks: {
        database: { status: 'up', latencyMs: 1 },
        redis: { status: 'down', latencyMs: 0, error: 'timeout' },
      },
    })

    const res = await request(app.getHttpServer()).get('/health')

    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
    expect(res.body.checks.redis.status).toBe('down')
  })

  it('GET /health returns 503 when service reports unhealthy', async () => {
    getHealth.mockResolvedValue({
      ...sampleOkBody,
      status: 'unhealthy',
      checks: {
        database: { status: 'down', latencyMs: 0, error: 'db' },
        redis: { status: 'down', latencyMs: 0, error: 'redis' },
      },
    })

    const res = await request(app.getHttpServer()).get('/health')

    expect(res.status).toBe(503)
    expect(res.body.status).toBe('unhealthy')
  })
})
