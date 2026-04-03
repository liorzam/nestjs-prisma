import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test, type TestingModuleBuilder } from '@nestjs/testing'
import { getOptionsToken } from '@nestjs/throttler'
import type Redis from 'ioredis'
import * as request from 'supertest'

import { AppModule } from '@/app.module'
import { configureHttpApp } from '@/common/configure-http-app'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'
import { REDIS_CLIENT } from '@/infrastructure/redis/redis.constants'

/** Low limit so the N+1 request returns 429 without hammering Redis. */
const E2E_THROTTLE_LIMIT = 3

async function bootstrapTestApp(
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<NestExpressApplication> {
  let builder = Test.createTestingModule({
    imports: [AppModule],
  })
  if (configure) {
    builder = configure(builder)
  }

  const moduleFixture = await builder.compile()

  const app = moduleFixture.createNestApplication<NestExpressApplication>({ bufferLogs: true })
  configureHttpApp(app)

  await app.init()
  return app
}

async function closeApp(app: NestExpressApplication): Promise<void> {
  const redis = app.get(REDIS_CLIENT)
  await redis.quit()
  await app.close()
}

describe('App (e2e)', () => {
  describe('default app', () => {
    let app: NestExpressApplication

    beforeAll(async () => {
      app = await bootstrapTestApp()
      const redis = app.get(REDIS_CLIENT)
      await redis.flushdb()
    })

    afterAll(async () => {
      await closeApp(app)
    })

    it('GET / returns project metadata', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            name: 'nestjs-agent',
            docs: 'See AGENTS.md and docs/architecture.md',
          })
        })
    })

    it('GET / uses helmet() defaults: strips X-Powered-By and sets standard security headers', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200)
      const h = res.headers

      // Helmet `hidePoweredBy` (see `appHelmetOptions` in configure-http-app)
      expect(h['x-powered-by']).toBeUndefined()

      // Helmet default stack (see `helmet` package — `getMiddlewareFunctionsFromOptions`)
      expect(h['content-security-policy']).toEqual(expect.any(String))
      expect(h['content-security-policy']).toContain("default-src 'self'")

      expect(h['x-content-type-options']).toBe('nosniff')
      expect(h['x-dns-prefetch-control']).toBe('off')
      expect(h['x-download-options']).toBe('noopen')
      expect(h['x-frame-options']).toBe('SAMEORIGIN')
      expect(h['x-permitted-cross-domain-policies']).toBe('none')
      expect(h['x-xss-protection']).toBe('0')

      expect(h['cross-origin-opener-policy']).toBe('same-origin')
      expect(h['cross-origin-resource-policy']).toBe('same-origin')
      expect(h['origin-agent-cluster']).toBe('?1')
      expect(h['referrer-policy']).toBe('no-referrer')
      expect(h['strict-transport-security']).toMatch(/^max-age=\d+/)
      expect(h['strict-transport-security']).toContain('includeSubDomains')
    })

    it('GET /health returns structured checks (200 when deps up, 503 when degraded)', async () => {
      const res = await request(app.getHttpServer()).get('/health')
      expect([200, 503]).toContain(res.status)

      expect(res.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
        checks: {
          database: expect.objectContaining({
            status: expect.any(String),
          }),
          redis: expect.objectContaining({
            status: expect.any(String),
          }),
        },
      })
    })
  })

  describe('rate limiting', () => {
    let app: NestExpressApplication

    beforeAll(async () => {
      app = await bootstrapTestApp((builder) =>
        builder.overrideProvider(getOptionsToken()).useFactory({
          factory: (redis: Redis) => ({
            throttlers: [
              {
                name: 'default',
                ttl: 60_000,
                limit: E2E_THROTTLE_LIMIT,
              },
            ],
            storage: new ThrottlerStorageRedisService(redis),
          }),
          inject: [REDIS_CLIENT],
        }),
      )
      const redis = app.get(REDIS_CLIENT)
      await redis.flushdb()
    })

    afterAll(async () => {
      await closeApp(app)
    })

    it('GET / returns 429 Too Many Requests after exceeding the limit', async () => {
      const server = app.getHttpServer()
      for (let i = 0; i < E2E_THROTTLE_LIMIT; i++) {
        await request(server).get('/').expect(200)
      }
      const res = await request(server).get('/').expect(429)
      expect(res.body).toMatchObject({
        statusCode: 429,
        path: '/',
      })
    })

    it('GET /health is not throttled (SkipThrottle) and never returns 429', async () => {
      const server = app.getHttpServer()
      for (let i = 0; i < 20; i++) {
        const res = await request(server).get('/health')
        expect([200, 503]).toContain(res.status)
        expect(res.status).not.toBe(429)
      }
    })
  })

  describe('AppMetadata CRUD', () => {
    let app: NestExpressApplication
    let prisma: PrismaService

    /** All keys created by this suite share this prefix so cleanup is safe. */
    const KEY = 'e2e.feature.x'

    beforeAll(async () => {
      app = await bootstrapTestApp()
      prisma = app.get(PrismaService)
    })

    afterAll(async () => {
      await closeApp(app)
    })

    beforeEach(async () => {
      await prisma.appMetadata.deleteMany({ where: { key: { startsWith: 'e2e.' } } })
    })

    it('GET /app-metadata returns empty array initially', async () => {
      const res = await request(app.getHttpServer()).get('/app-metadata')
      expect(res.status).toBe(200)
      // Only e2e keys were deleted; other entries may exist — filter to our prefix
      const e2eEntries = (res.body as { key: string }[]).filter((e) => e.key.startsWith('e2e.'))
      expect(e2eEntries).toEqual([])
    })

    it('PUT /app-metadata/:key creates a new entry and returns 200', async () => {
      const res = await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: { enabled: true, version: 1 } })

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        key: KEY,
        value: { enabled: true, version: 1 },
        id: expect.any(String) as string,
        createdAt: expect.any(String) as string,
        updatedAt: expect.any(String) as string,
      })
    })

    it('PUT /app-metadata/:key is idempotent — updates value on second call', async () => {
      await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: { enabled: true } })
        .expect(200)

      const res = await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: { enabled: false, updated: true } })

      expect(res.status).toBe(200)
      expect(res.body.value).toEqual({ enabled: false, updated: true })
    })

    it('GET /app-metadata/:key returns the stored entry', async () => {
      await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: { hello: 'world' } })
        .expect(200)

      const res = await request(app.getHttpServer()).get(`/app-metadata/${KEY}`)

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ key: KEY, value: { hello: 'world' } })
    })

    it('GET /app-metadata/:key returns 404 for a missing key', async () => {
      const res = await request(app.getHttpServer()).get('/app-metadata/e2e.does-not-exist')

      expect(res.status).toBe(404)
    })

    it('GET /app-metadata lists the newly created entry', async () => {
      await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: { x: 1 } })
        .expect(200)

      const res = await request(app.getHttpServer()).get('/app-metadata')

      expect(res.status).toBe(200)
      const entry = (res.body as { key: string }[]).find((e) => e.key === KEY)
      expect(entry).toMatchObject({ key: KEY, value: { x: 1 } })
    })

    it('DELETE /app-metadata/:key returns 204 and removes the entry', async () => {
      await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: {} })
        .expect(200)

      const del = await request(app.getHttpServer()).delete(`/app-metadata/${KEY}`)
      expect(del.status).toBe(204)
      expect(del.body).toEqual({})

      const get = await request(app.getHttpServer()).get(`/app-metadata/${KEY}`)
      expect(get.status).toBe(404)
    })

    it('DELETE /app-metadata/:key returns 404 for a missing key', async () => {
      const res = await request(app.getHttpServer()).delete('/app-metadata/e2e.does-not-exist')
      expect(res.status).toBe(404)
    })

    it('PUT /app-metadata/:key returns 400 when body is missing value field', async () => {
      const res = await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ notValue: 'wrong' })

      expect(res.status).toBe(400)
    })

    it('PUT /app-metadata/:key returns 400 when value is not an object', async () => {
      const res = await request(app.getHttpServer())
        .put(`/app-metadata/${KEY}`)
        .send({ value: 'a string, not an object' })

      expect(res.status).toBe(400)
    })
  })
})
