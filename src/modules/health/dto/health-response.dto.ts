export interface HealthResponseDto {
  status: 'ok'
  timestamp: string
  checks: {
    database: 'up' | 'down'
    redis: 'up' | 'down'
  }
}
