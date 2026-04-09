
# Agent orchestration — this NestJS codebase

Use this file as the **primary navigation anchor** before editing routes, DTOs, or persistence.

For **project name, exact scripts, stack table, and CLI usage**, read [`docs/PROJECT.md`](docs/PROJECT.md) first — it is kept in sync with `package.json` and infrastructure.

## Stack (non-negotiable facts)

- **Package manager**: **pnpm** only (`pnpm-lock.yaml` is canonical). Install deps with `pnpm install`; run scripts with `pnpm run <script>` or `pnpm <script>` when defined. Use `pnpm exec <bin>` for one-off CLIs (e.g. `pnpm exec prisma migrate dev`). Do not add `package-lock.json` or `yarn.lock`.
- **Runtime**: NestJS (modular DI, pipes, guards, interceptors).
- **HTTP contracts**: DTOs with **class-validator** + **class-transformer**; global `ValidationPipe` with `whitelist: true`, `transform: true`, `enableImplicitConversion: true`.
- **Persistence**: **PostgreSQL** via **Prisma**; application metadata and domain data live in Prisma models — do not hand-write SQL unless a migration/raw query is explicitly required.

## Where things live

| Area | Purpose |
|------|---------|
| `src/modules/<domain>/` | Feature modules (controller, service, `dto/`, optional `entities/` as TS types — not TypeORM unless stated) |
| `src/common/` | Shared pipes, filters, interceptors, guards, decorators, logging |
| `src/infrastructure/` | Prisma module/service, Redis module — single entry to each external system |
| `prisma/schema.prisma` | Data model; migrations under `prisma/migrations/` |

## Safe-change vs do-not-edit zones

| Zone | Agent behavior |
|------|----------------|
| `prisma/migrations/**` | **Do not** rename or edit past migration SQL. New changes = new migration via Prisma CLI. |
| `node_modules/`, `dist/` | Never edit. |
| Generated Prisma Client | Do not commit manual edits; regenerate from schema. |
| `*.dto.ts` / `dto/**` | Preferred place for input/output shapes + validation decorators. |

## Validation / Transform rules

The global `ValidationPipe` (configured in `src/common/configure-http-app.ts`) runs on every request with:

```
whitelist: true               — strips fields not declared in the DTO class
forbidNonWhitelisted: false   — silently strips (no 400); flip to true to reject unknown fields
transform: true               — instantiates the DTO class (needed for @Type() and defaults)
enableImplicitConversion: true — coerces query-string strings to number/boolean automatically
```

### Input DTO cheat-sheet (class-validator)

```typescript
import {
  IsString, IsInt, IsBoolean, IsEmail, IsEnum, IsOptional,
  IsObject, IsArray, ValidateNested, Min, Max, Length, Matches,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

// Primitive scalars
@IsString()   value: string
@IsInt()      count: number          // validates AND (with implicit conversion) coerces '42' → 42
@IsBoolean()  active: boolean        // coerces 'true'/'false' → boolean
@IsEmail()    email: string

// Optionals — @IsOptional() must be listed BEFORE the type decorator
@IsOptional()
@IsString()   name?: string

// Enums
enum Role { Admin = 'admin', User = 'user' }
@IsEnum(Role) role: Role

// Nested DTO
@ValidateNested()
@Type(() => AddressDto)             // @Type() is required for transform to build the nested class
address: AddressDto

// Array of nested DTOs
@IsArray()
@ValidateNested({ each: true })
@Type(() => TagDto)
tags: TagDto[]

// Explicit transform (use sparingly; prefer implicit conversion or @Type())
@Transform(({ value }) => value?.trim())
@IsString()
slug: string
```

### Prisma JSON field pattern

Prisma's `Json` column type maps to `Prisma.JsonValue` on reads and `Prisma.InputJsonValue` on writes.
Cast at the service boundary:

```typescript
const jsonValue = dto.value as Prisma.InputJsonValue
await this.prisma.myModel.create({ data: { payload: jsonValue } })
```

Use `@IsObject()` in the DTO when the expected shape is a plain object. Avoid `@IsJSON()` — it validates a JSON *string*, not a parsed value.

### Reference implementation

`src/modules/app-metadata/` is the canonical example of:
- `UpsertAppMetadataDto` with `@IsObject()` for a `Json` Prisma field
- Idempotent `upsert` via `prisma.appMetadata.upsert()`
- `toDto()` mapper converting `Date → ISO string` and `Prisma.JsonValue → Record<string, unknown>`
- Controller using `@Put(':key')` + `@HttpCode(204)` on `@Delete(':key')`

## Typical request path (for reasoning about bugs)

1. HTTP → Controller (thin: delegate only).
2. `ValidationPipe` strips unknown fields, instantiates DTO class, coerces types.
3. Service → Prisma (or domain helpers) → structured logs with correlation ID.
4. `AllExceptionsFilter` catches unhandled errors: `HttpException` keeps its status and body shape; other errors return 500 — in production the JSON includes `errorId` and safe tracing fields only, while non-production responses add `error`, `message`, and `stack` for debugging.

## AppMetadata module (key-value store in PostgreSQL)

`AppMetadata` (`prisma/schema.prisma`) is the built-in key-value table for storing application configuration and runtime metadata. Access it via `AppMetadataService` (exported from `AppMetadataModule`):

```typescript
// In a service that imports AppMetadataModule:
await this.appMetadata.upsert('feature.flag.x', { enabled: true })
const entry = await this.appMetadata.getByKey('feature.flag.x')
```

Routes:
| Method | Path | Description |
|--------|------|-------------|
| GET | /app-metadata | List all entries (ordered by key) |
| GET | /app-metadata/:key | Get one entry; 404 if missing |
| PUT | /app-metadata/:key | Upsert (idempotent) |
| DELETE | /app-metadata/:key | Delete; 404 if missing; 204 on success |

## Dependency map (maintain as modules grow)

- **Modules** should import other modules via their **exported** providers only (`Module({ exports: [...] })`).
- **Prisma**: one `PrismaModule` (global) wrapping `PrismaService`.

Keep **`docs/dependency-map.md`** in sync when adding cross-module imports or external systems.

## Quick checklist before submitting edits

- [ ] DTOs cover all body/query/params; no `any` on public API.
- [ ] Input DTOs are classes with `class-validator` decorators; response DTOs may be interfaces.
- [ ] `@Type(() => NestedDto)` present when using `@ValidateNested()`.
- [ ] `@IsOptional()` listed before the type decorator on optional fields.
- [ ] Sensitive fields excluded with `@Exclude()` + serialization path if returning entities.
- [ ] Prisma access only through the dedicated service/module.
- [ ] Prisma `Json` fields cast to `Prisma.InputJsonValue` at the service write boundary.
- [ ] New env vars validated in config module using Joi — not read ad hoc.
- [ ] `docs/dependency-map.md` updated if a new cross-module import was introduced.
