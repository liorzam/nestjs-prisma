# Architecture (agent reference)

See **[PROJECT.md](PROJECT.md)** for the concrete stack, scripts, and tooling versions.

## System design

- **API layer**: NestJS HTTP on **Express** with modular routing; validation at the edge via `ValidationPipe` and DTOs.
- **Application layer**: Services coordinate use cases; remain framework-aware only where necessary (e.g. injecting `REQUEST` scope).
- **Persistence**: PostgreSQL accessed only through **Prisma**; application metadata and domain tables are modeled in `prisma/schema.prisma`.

## Module relationships

Document imports here as the app grows:

| Module | Imports (examples) | Exports |
|--------|--------------------|---------|
| `PrismaModule` | — | `PrismaService` |
| `<Feature>Module` | `PrismaModule` | `<Feature>Service` |

**Rule**: Cross-feature calls go through exported providers or shared domain utilities — not by reaching into another module’s internal files.

## Request lifecycle

1. **Ingress**: Middleware / guards (auth, rate limits) → optional correlation ID attachment.
2. **Routing**: Controller method matched.
3. **Validation**: `ValidationPipe` + DTO — whitelist, transform, class-validator errors → `400` with structured payload if using a global filter.
4. **Handler**: Service method; may use `PrismaService` transactions.
5. **Egress**: Serialize response using a dedecate DTO which encapsulate sensitive information

## External systems

| System | Role |
|--------|------|
| PostgreSQL | Primary store (Prisma) |

_Add Redis, queues, etc. when introduced._

## Observability (when implemented)

- Structured JSON logs; include `correlationId` on each request-scoped log line.
- Central exception filter maps known errors to HTTP codes without leaking internals.
