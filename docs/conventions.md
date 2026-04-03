# Conventions (agent reference)

## Package manager

- Use **pnpm** (`package.json` declares `packageManager`). Typical commands: `pnpm install`, `pnpm run build`, `pnpm run start:dev`, `pnpm run prisma:migrate`.
- Prefer `pnpm exec prisma …` over global Prisma when not using package scripts.

## Naming

- **Files**: `kebab-case` for multi-word files (`user-profile.controller.ts`); Nest style uses `*.controller.ts`, `*.service.ts`, `*.module.ts`.
- **Classes**: `PascalCase`; DTOs suffixed with `Dto` (`CreateUserDto`).
- **Database** (Prisma): `PascalCase` models, `camelCase` fields; use `@map` when DB column names differ.

## Folder structure

```
src/
  common/           # pipes, filters, interceptors, guards, decorators
  modules/<domain>/
    *.module.ts
    *.controller.ts
    *.service.ts
    dto/
    (optional) domain/ or use-cases/ for pure functions
  infrastructure/   # DB, Redis, external APIs
prisma/
  schema.prisma
  migrations/
```

## DTOs and validation

Input DTOs **must** be classes (not interfaces) so `class-validator` and `class-transformer` can operate on them at runtime.

### Global ValidationPipe settings

Configured in `src/common/configure-http-app.ts`:

| Option | Value | Effect |
|--------|-------|--------|
| `whitelist` | `true` | Strips undeclared properties before the DTO reaches the handler |
| `forbidNonWhitelisted` | `false` | Silently strips (flip to `true` to reject with 400) |
| `transform` | `true` | Instantiates DTO class instances (required for `@Type()` and default values) |
| `enableImplicitConversion` | `true` | Coerces query-string strings to `number`/`boolean` based on TypeScript type metadata |

### Common decorator patterns

```typescript
import {
  IsString, IsInt, IsBoolean, IsEmail, IsUrl, IsEnum,
  IsOptional, IsNotEmpty, IsObject, IsArray,
  Min, Max, Length, Matches,
  ValidateNested, ValidateIf,
} from 'class-validator'
import { Type, Transform, Exclude, Expose } from 'class-transformer'

// ── Scalars ──────────────────────────────────────────────────────────────────

@IsString()
@IsNotEmpty()
name: string

@IsInt()
@Min(1) @Max(100)
limit: number                  // query-string '10' → 10 with enableImplicitConversion

@IsBoolean()
active: boolean                // query-string 'true' → true

@IsEmail()
email: string

@IsUrl()
callbackUrl: string

// ── Optionals (decorator order matters) ──────────────────────────────────────

@IsOptional()                  // must come FIRST so missing values skip subsequent checks
@IsString()
description?: string

// ── Enums ────────────────────────────────────────────────────────────────────

enum Status { Active = 'active', Inactive = 'inactive' }

@IsEnum(Status)
status: Status

// ── Nested DTOs ──────────────────────────────────────────────────────────────

@ValidateNested()
@Type(() => AddressDto)        // @Type() is REQUIRED — tells class-transformer which class to build
address: AddressDto

// ── Arrays of nested DTOs ────────────────────────────────────────────────────

@IsArray()
@ValidateNested({ each: true })
@Type(() => ItemDto)
items: ItemDto[]

// ── JSON object (Prisma Json field) ──────────────────────────────────────────

@IsObject()
payload: Record<string, unknown>   // validated as plain object; cast to Prisma.InputJsonValue in service

// ── Explicit transform (normalize before validation) ─────────────────────────

@Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
@IsString()
slug: string

// ── Conditional validation ───────────────────────────────────────────────────

@ValidateIf((o) => o.type === 'email')
@IsEmail()
contactEmail?: string

// ── Response DTO: exclude sensitive fields ───────────────────────────────────
// Requires ClassSerializerInterceptor or manual mapping.

class UserResponseDto {
  id: string
  email: string

  @Exclude()
  passwordHash: string          // never sent over the wire
}
```

### When to use `@Type()` vs `enableImplicitConversion`

| Scenario | Approach |
|----------|----------|
| Query-string `?limit=10` → `number` | `enableImplicitConversion: true` handles it automatically |
| Body `{ "address": {...} }` → `AddressDto` | `@Type(() => AddressDto)` is required |
| Body array `[{...}]` → `ItemDto[]` | `@Type(() => ItemDto)` + `@IsArray()` + `@ValidateNested({ each: true })` |
| Transforming a value (trim, lowercase) | `@Transform(({ value }) => ...)` |

### Response DTOs

- Response DTOs may be plain **interfaces** (no class-transformer needed) when there are no sensitive fields to exclude.
- Use **classes** with `@Exclude()` / `@Expose()` only when you need field-level serialization control.
- Never return a raw Prisma entity — always map through a `toDto()` helper or a response DTO.
- Dates: serialize `Date → .toISOString()` in the mapper so the wire format is always ISO 8601 string.

## Prisma

- Inject `PrismaService` in services; avoid ad-hoc `new PrismaClient()` in app code.
- Schema changes: edit `schema.prisma` → `pnpm run prisma:migrate` → `pnpm run prisma:generate`.
- **Json fields**: cast at the write boundary — `value as Prisma.InputJsonValue`; read boundary is `Prisma.JsonValue`.
- See `src/modules/app-metadata/app-metadata.service.ts` for the canonical Json field pattern.

## File header metadata

Add to controllers and non-trivial services so agents can orient quickly:

```typescript
/**
 * @module UserModule
 * @responsibility User CRUD and related HTTP endpoints
 * @dependencies PrismaService, (optionally) AppMetadataService
 * @entrypoints POST /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id
 */
```

Keep entries **accurate** when refactoring — stale metadata is worse than none.

## Testing

- **Unit**: services with mocked `PrismaService` (or repository ports).
- **E2E**: `supertest` against `INestApplication` with real DB via `test/setup-e2e.ts`.
- Mock only at system boundaries (Prisma, Redis); do not mock NestJS internals.
