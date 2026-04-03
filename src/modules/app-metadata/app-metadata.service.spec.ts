import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { AppMetadataService } from './app-metadata.service'

describe('AppMetadataService', () => {
  let service: AppMetadataService

  const findMany = jest.fn()
  const findUnique = jest.fn()
  const upsert = jest.fn()
  const deleteFn = jest.fn()

  const now = new Date('2026-04-03T12:00:00.000Z')

  const sampleRow = {
    id: 'cuid1',
    key: 'feature.x',
    value: { enabled: true },
    createdAt: now,
    updatedAt: now,
  }

  const sampleDto = {
    id: 'cuid1',
    key: 'feature.x',
    value: { enabled: true },
    createdAt: '2026-04-03T12:00:00.000Z',
    updatedAt: '2026-04-03T12:00:00.000Z',
  }

  beforeEach(async () => {
    findMany.mockReset()
    findUnique.mockReset()
    upsert.mockReset()
    deleteFn.mockReset()

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppMetadataService,
        {
          provide: PrismaService,
          useValue: {
            appMetadata: { findMany, findUnique, upsert, delete: deleteFn },
          },
        },
      ],
    }).compile()

    service = moduleRef.get(AppMetadataService)
  })

  describe('getAll', () => {
    it('returns all entries mapped to DTOs, ordered by key', async () => {
      findMany.mockResolvedValue([sampleRow])

      const result = await service.getAll()

      expect(result).toEqual([sampleDto])
      expect(findMany).toHaveBeenCalledWith({ orderBy: { key: 'asc' } })
    })

    it('returns empty array when no entries exist', async () => {
      findMany.mockResolvedValue([])

      expect(await service.getAll()).toEqual([])
    })
  })

  describe('getByKey', () => {
    it('returns the entry when found', async () => {
      findUnique.mockResolvedValue(sampleRow)

      const result = await service.getByKey('feature.x')

      expect(result).toEqual(sampleDto)
      expect(findUnique).toHaveBeenCalledWith({ where: { key: 'feature.x' } })
    })

    it('throws NotFoundException when key does not exist', async () => {
      findUnique.mockResolvedValue(null)

      await expect(service.getByKey('missing')).rejects.toThrow(NotFoundException)
    })

    it('includes the missing key in the NotFoundException message', async () => {
      findUnique.mockResolvedValue(null)

      await expect(service.getByKey('missing')).rejects.toThrow('missing')
    })
  })

  describe('upsert', () => {
    it('calls prisma.upsert with the correct create and update payloads', async () => {
      upsert.mockResolvedValue(sampleRow)

      const result = await service.upsert('feature.x', { enabled: true })

      expect(result).toEqual(sampleDto)
      expect(upsert).toHaveBeenCalledWith({
        where: { key: 'feature.x' },
        create: { key: 'feature.x', value: { enabled: true } },
        update: { value: { enabled: true } },
      })
    })

    it('accepts any JSON object as value', async () => {
      const complexValue = { nested: { a: 1 }, list: [1, 2, 3], flag: false }
      upsert.mockResolvedValue({ ...sampleRow, value: complexValue })

      const result = await service.upsert('complex', complexValue)

      expect(result.value).toEqual(complexValue)
    })
  })

  describe('delete', () => {
    it('deletes an existing entry and resolves void', async () => {
      findUnique.mockResolvedValue(sampleRow)
      deleteFn.mockResolvedValue(sampleRow)

      await expect(service.delete('feature.x')).resolves.toBeUndefined()
      expect(deleteFn).toHaveBeenCalledWith({ where: { key: 'feature.x' } })
    })

    it('throws NotFoundException when key does not exist', async () => {
      findUnique.mockResolvedValue(null)

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException)
    })

    it('does not call prisma.delete when the entry is not found', async () => {
      findUnique.mockResolvedValue(null)

      await expect(service.delete('missing')).rejects.toThrow()
      expect(deleteFn).not.toHaveBeenCalled()
    })
  })

  describe('toDto (date serialization)', () => {
    it('serializes Date fields to ISO 8601 strings', async () => {
      findMany.mockResolvedValue([sampleRow])

      const [dto] = await service.getAll()

      expect(dto.createdAt).toBe('2026-04-03T12:00:00.000Z')
      expect(dto.updatedAt).toBe('2026-04-03T12:00:00.000Z')
    })
  })
})
