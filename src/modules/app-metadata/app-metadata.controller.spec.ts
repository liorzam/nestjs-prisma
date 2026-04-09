import type { INestApplication } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'

import { AppMetadataController } from './app-metadata.controller'
import { AppMetadataService } from './app-metadata.service'

describe('AppMetadataController', () => {
  let app: INestApplication

  const getAll = jest.fn()
  const getByKey = jest.fn()
  const upsert = jest.fn()
  const deleteFn = jest.fn()

  const sampleEntry = {
    id: 'cuid1',
    key: 'feature.x',
    value: { enabled: true },
    createdAt: '2026-04-03T12:00:00.000Z',
    updatedAt: '2026-04-03T12:00:00.000Z',
  }

  beforeEach(async () => {
    getAll.mockReset()
    getByKey.mockReset()
    upsert.mockReset()
    deleteFn.mockReset()

    const moduleRef = await Test.createTestingModule({
      controllers: [AppMetadataController],
      providers: [
        {
          provide: AppMetadataService,
          useValue: { getAll, getByKey, upsert, delete: deleteFn },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    if (app) await app.close()
  })

  describe('GET /app-metadata', () => {
    it('returns 200 with all entries', async () => {
      getAll.mockResolvedValue([sampleEntry])

      const res = await request(app.getHttpServer()).get('/app-metadata')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([sampleEntry])
      expect(getAll).toHaveBeenCalledTimes(1)
    })

    it('returns 200 with empty array when no entries exist', async () => {
      getAll.mockResolvedValue([])

      const res = await request(app.getHttpServer()).get('/app-metadata')

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('GET /app-metadata/:key', () => {
    it('returns 200 with the entry when found', async () => {
      getByKey.mockResolvedValue(sampleEntry)

      const res = await request(app.getHttpServer()).get('/app-metadata/feature.x')

      expect(res.status).toBe(200)
      expect(res.body).toEqual(sampleEntry)
      expect(getByKey).toHaveBeenCalledWith('feature.x')
    })

    it('returns 404 when the key does not exist', async () => {
      getByKey.mockRejectedValue(new NotFoundException('AppMetadata key "missing" not found'))

      const res = await request(app.getHttpServer()).get('/app-metadata/missing')

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /app-metadata/:key', () => {
    it('returns 200 with the upserted entry', async () => {
      upsert.mockResolvedValue(sampleEntry)

      const res = await request(app.getHttpServer())
        .put('/app-metadata/feature.x')
        .send({ value: { enabled: true } })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(sampleEntry)
      expect(upsert).toHaveBeenCalledWith('feature.x', { enabled: true })
    })

    it('passes the key from the URL param to the service', async () => {
      upsert.mockResolvedValue({ ...sampleEntry, key: 'other.key' })

      await request(app.getHttpServer()).put('/app-metadata/other.key').send({ value: {} })

      expect(upsert).toHaveBeenCalledWith('other.key', {})
    })
  })

  describe('DELETE /app-metadata/:key', () => {
    it('returns 204 No Content on successful deletion', async () => {
      deleteFn.mockResolvedValue(undefined)

      const res = await request(app.getHttpServer()).delete('/app-metadata/feature.x')

      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
      expect(deleteFn).toHaveBeenCalledWith('feature.x')
    })

    it('returns 404 when the key does not exist', async () => {
      deleteFn.mockRejectedValue(new NotFoundException('AppMetadata key "missing" not found'))

      const res = await request(app.getHttpServer()).delete('/app-metadata/missing')

      expect(res.status).toBe(404)
    })
  })
})
