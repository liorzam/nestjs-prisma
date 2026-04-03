import { IsObject } from 'class-validator'

/**
 * Body for PUT /app-metadata/:key
 *
 * ValidationPipe (global) handles:
 *   - whitelist: strips unknown top-level fields
 *   - transform: coerces incoming JSON to class instance
 *
 * Add @Type(() => NestedDto) + @ValidateNested() for deeply nested shapes.
 */
export class UpsertAppMetadataDto {
  /** Arbitrary JSON object stored as the metadata value. */
  @IsObject()
  value!: Record<string, unknown>
}
