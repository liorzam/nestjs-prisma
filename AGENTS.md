# Agent orchestration — this NestJS codebase

Use this file as the **primary navigation anchor** before editing routes, DTOs, or persistence.

For **project name, exact scripts, stack table, and CLI usage**, read [`docs/PROJECT.md`](docs/PROJECT.md) first — it is kept in sync with `package.json` and infrastructure.

## Stack (non-negotiable facts)

- **Package manager**: **pnpm** only (`pnpm-lock.yaml` is canonical). Install deps with `pnpm install`; run scripts with `pnpm run <script>` or `pnpm <script>` when defined. Use `pnpm exec <bin>` for one-off CLIs (e.g. `pnpm exec prisma migrate dev`). Do not add `package-lock.json` or `yarn.lock`.
- **Runtime**: NestJS (modular DI, pipes, guards, interceptors).
- **HTTP contracts**: DTOs with **class-validator** + **class-transformer**; global or scoped `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
- **Persistence**: **PostgreSQL** via **Prisma**; application metadata and domain data live in Prisma models — do not hand-write SQL unless a migration/raw query is explicitly required.

## Where things live

| Area | Purpose |
|------|---------|
| `src/modules/<domain>/` | Feature modules (controller, service, `dto/`, optional `entities/` as TS types — not TypeORM unless stated) |
| `src/common/` | Shared pipes, filters, interceptors, guards, decorators, logging |
| `src/infrastructure/` or `src/prisma/` | Prisma module/service, DB bootstrap — **single** entry to `PrismaClient` |
| `prisma/schema.prisma` | Data model; migrations under `prisma/migrations/` |

## Safe-change vs do-not-edit zones

| Zone | Agent behavior |
|------|----------------|
| `prisma/migrations/**` | **Do not** rename or edit past migration SQL. New changes = new migration via Prisma CLI. |
| `node_modules/`, `dist/` | Never edit. |
| Generated Prisma Client | Do not commit manual edits; regenerate from schema. |
| `*.dto.ts` / `dto/**` | Preferred place for input/output shapes + validation decorators. |

## Typical request path (for reasoning about bugs)

1. HTTP → Controller (thin: delegate only).
2. `ValidationPipe` + DTO transforms defaults/types.
3. Service → Prisma (or domain helpers) → structured logs with correlation ID (if configured).

## Dependency map (maintain as modules grow)

- **Modules** should import other modules via their **exported** providers only (`Module({ exports: [...] })`).
- **Prisma**: one `PrismaModule` (global or explicit imports) wrapping `PrismaService` that extends/opens `PrismaClient` and handles `onModuleInit`/`onModuleDestroy`.

Keep **`docs/dependency-map.md`** in sync when adding cross-module imports or external systems (Redis, queues, etc.). The **Module relationships** table in `docs/architecture.md` can stay high-level.

## Quick checklist before submitting edits

- [ ] DTOs cover all body/query/params; no `any` on public API.
- [ ] Sensitive fields excluded with `@Exclude()` + serialization path if returning entities.
- [ ] Prisma access only through the dedicated service/module.
- [ ] New env vars validated in config module / Joi/Zod — not read ad hoc.
