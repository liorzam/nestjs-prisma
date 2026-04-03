import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common'
import { AppMetadataService } from './app-metadata.service'
import type { AppMetadataResponseDto } from './dto/app-metadata-response.dto'
import { UpsertAppMetadataDto } from './dto/upsert-app-metadata.dto'

/**
 * @module AppMetadataModule
 * @responsibility HTTP endpoints for key-value application metadata stored in PostgreSQL.
 * @dependencies AppMetadataService → PrismaService
 * @entrypoints GET /app-metadata, GET /app-metadata/:key, PUT /app-metadata/:key, DELETE /app-metadata/:key
 */
@Controller('app-metadata')
export class AppMetadataController {
  constructor(private readonly service: AppMetadataService) {}

  @Get()
  getAll(): Promise<AppMetadataResponseDto[]> {
    return this.service.getAll()
  }

  @Get(':key')
  getByKey(@Param('key') key: string): Promise<AppMetadataResponseDto> {
    return this.service.getByKey(key)
  }

  /** PUT is idempotent: safe to call multiple times with the same payload. */
  @Put(':key')
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertAppMetadataDto,
  ): Promise<AppMetadataResponseDto> {
    return this.service.upsert(key, dto.value)
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('key') key: string): Promise<void> {
    return this.service.delete(key)
  }
}
