import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'
import type { AppMetadataResponseDto } from './dto/app-metadata-response.dto'

/**
 * @module AppMetadataModule
 * @responsibility Read and write key-value application metadata in PostgreSQL.
 * @dependencies PrismaService
 */
@Injectable()
export class AppMetadataService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<AppMetadataResponseDto[]> {
    const rows = await this.prisma.appMetadata.findMany({ orderBy: { key: 'asc' } })
    return rows.map(this.toDto)
  }

  async getByKey(key: string): Promise<AppMetadataResponseDto> {
    const row = await this.prisma.appMetadata.findUnique({ where: { key } })
    if (!row) throw new NotFoundException(`AppMetadata key "${key}" not found`)
    return this.toDto(row)
  }

  /** Idempotent upsert — creates on first call, patches on subsequent calls. */
  async upsert(key: string, value: Record<string, unknown>): Promise<AppMetadataResponseDto> {
    const jsonValue = value as Prisma.InputJsonValue
    const row = await this.prisma.appMetadata.upsert({
      where: { key },
      create: { key, value: jsonValue },
      update: { value: jsonValue },
    })
    return this.toDto(row)
  }

  async delete(key: string): Promise<void> {
    const existing = await this.prisma.appMetadata.findUnique({ where: { key } })
    if (!existing) throw new NotFoundException(`AppMetadata key "${key}" not found`)
    await this.prisma.appMetadata.delete({ where: { key } })
  }

  private toDto(row: {
    id: string
    key: string
    value: Prisma.JsonValue
    createdAt: Date
    updatedAt: Date
  }): AppMetadataResponseDto {
    return {
      id: row.id,
      key: row.key,
      value: row.value as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }
}
