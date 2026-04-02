# Module and external dependency map

_Update this file when modules or integrations change so agents have a single checklist._

## Nest modules → modules

| From | To | Notes |
|------|-----|--------|
| _example_ | `PrismaModule` | Import once per feature or use `Global()` Prisma module |

## Nest modules → external systems

| Module | External | Purpose |
|--------|----------|---------|
| `PrismaModule` | PostgreSQL | Prisma Client |

## Optional: Redis / Kafka / queues

_Add rows when you introduce them; document key prefixes and TTL policy in code or here._
