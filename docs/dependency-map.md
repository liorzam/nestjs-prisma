# Module and external dependency map

_Update this file when modules or integrations change so agents have a single checklist._

## Nest modules → modules

| From | To | Notes |
|------|----|-------|
| `AppModule` | `ConfigEnvModule` | Global; provides `ConfigEnvService` |
| `AppModule` | `LoggerModule` (nestjs-pino) | Global; async config via `ConfigEnvService` |
| `AppModule` | `RedisModule` | Global; provides `REDIS_CLIENT` (ioredis) |
| `AppModule` | `ThrottlerModule` | Global; backed by Redis via `ThrottlerStorageRedisService` |
| `AppModule` | `PrismaModule` | Global; provides `PrismaService` |
| `AppModule` | `HealthModule` | Feature module |
| `AppModule` | `AppMetadataModule` | Feature module; exports `AppMetadataService` |
| `HealthModule` | `PrismaModule` | Via global provider — `PrismaService` |
| `HealthModule` | `RedisModule` | Via global provider — `REDIS_CLIENT` |
| `AppMetadataModule` | `PrismaModule` | Via global provider — `PrismaService` |

## Nest modules → external systems

| Module | External system | Purpose |
|--------|----------------|---------|
| `PrismaModule` | PostgreSQL | Prisma Client (all domain/app-metadata reads + writes) |
| `RedisModule` | Redis | ioredis client shared with ThrottlerModule for rate-limit counters |
| `HealthModule` | PostgreSQL | `SELECT 1` liveness probe via `PrismaService` |
| `HealthModule` | Redis | `PING` liveness probe via `REDIS_CLIENT` |

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
