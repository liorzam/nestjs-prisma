/**
 * Shape returned by every AppMetadata endpoint.
 * Dates are serialized to ISO 8601 strings so the wire format is JSON-safe.
 */
export interface AppMetadataResponseDto {
  id: string
  key: string
  value: Record<string, unknown>
  /** ISO 8601 */
  createdAt: string
  /** ISO 8601 */
  updatedAt: string
}
