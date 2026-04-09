# Module and external dependency map

_Update this file when modules or integrations change so agents have a single checklist._

## Nest modules → modules

| From | To | Notes |
|------|----|-------|
| `AppModule` | `AppNestConfigModule` | Thin wrapper; global `@nestjs/config` bootstrap + Joi validation |
| `AppNestConfigModule` | `ConfigModule` (`@nestjs/config`) | `forRoot` + re-export; `load` + `validationSchema` |
| `AppModule` | `ConfigEnvModule` | Global; provides `ConfigEnvService` |
| `AppModule` | `AppLoggerModule` | Thin wrapper; Pino HTTP logging |
| `AppLoggerModule` | `LoggerModule` (nestjs-pino) | `forRootAsync` + re-export; factory uses `ConfigEnvService` |
| `AppLoggerModule` | `ConfigEnvModule` | Injects `ConfigEnvService` for logger factory |
| `AppModule` | `RedisModule` | Global; provides `REDIS_CLIENT` (ioredis) |
| `AppModule` | `AppThrottlerModule` | Thin wrapper; rate limiting backed by Redis |
| `AppThrottlerModule` | `ThrottlerModule` (`@nestjs/throttler`) | `forRootAsync` + re-export; Redis storage |
| `AppThrottlerModule` | `RedisModule` | Injects `REDIS_CLIENT` for `ThrottlerStorageRedisService` |
| `AppModule` | `PrismaModule` | Global; provides `PrismaService` |
| `AppModule` | `HealthModule` | Feature module |
| `AppModule` | `AppMetadataModule` | Feature module; exports `AppMetadataService` |
| `PrismaModule` | `HealthModule` | Imports to obtain `HealthCheckRegistry`; registers `DatabaseHealthCheckProvider` on init |
| `RedisModule` | `HealthModule` | Imports to obtain `HealthCheckRegistry`; registers `RedisHealthCheckProvider` on init |
| `AppMetadataModule` | `PrismaModule` | Via global provider — `PrismaService` |

## Nest modules → external systems

| Module | External system | Purpose |
|--------|----------------|---------|
| `PrismaModule` | PostgreSQL | Prisma Client (all domain/app-metadata reads + writes); `SELECT 1` health probe via `DatabaseHealthCheckProvider` |
| `RedisModule` | Redis | ioredis client shared with ThrottlerModule for rate-limit counters; `PING` health probe via `RedisHealthCheckProvider` |

## Redis key patterns

| Consumer | Key pattern | TTL |
|----------|------------|-----|
| ThrottlerModule | `throttle:<ip>:default` (managed by `@nestjs/throttler`) | 60 s |

_Add rows when new consumers write to Redis._

## AppMetadata PostgreSQL table

Table: `app_metadata` (Prisma model: `AppMetadata`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | cuid string | Primary key |
| `key` | string (unique) | Logical name for the metadata entry |
| `value` | Json | Arbitrary JSON object |
| `createdAt` / `updatedAt` | DateTime | Managed by Prisma |

Access exclusively through `AppMetadataService` — never query this table ad-hoc.
