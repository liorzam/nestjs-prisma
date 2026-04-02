# Conventions (agent reference)

## Package manager

- Use **pnpm** (`package.json` declares `packageManager`). Typical commands: `pnpm install`, `pnpm run build`, `pnpm run start:dev`, `pnpm run prisma:migrate`.
- Prefer `pnpm exec prisma …` over global Prisma when not using package scripts.

## Naming

- **Files**: `kebab-case` for multi-word files (`user-profile.controller.ts`); Nest style often uses `*.controller.ts`, `*.service.ts`, `*.module.ts`.
- **Classes**: `PascalCase`; DTOs suffixed with `Dto` (`CreateUserDto`).
- **Database** (Prisma): `PascalCase` models, `snake_case` or `camelCase` columns per `schema.prisma` with explicit `@map` when DB names differ.

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
  infrastructure/ # or prisma/ — DB, external APIs
prisma/
  schema.prisma
  migrations/
```

## DTOs and validation

- Inputs: `class-validator` decorators; nested DTOs with `@ValidateNested()` + `@Type()`.
- Coercion: `class-transformer` + `transform: true` on `ValidationPipe`.
- Do not return Prisma entities directly if they contain sensitive fields — map to response DTOs or use serialization exclusions.

## Prisma

- Inject `PrismaService` in services; avoid ad-hoc `new PrismaClient()` in app code.
- Schema changes flow: edit `schema.prisma` → migration → regenerate client.

## File header metadata (optional but helpful for agents)

```typescript
/**
 * @module UserModule
 * @responsibility User CRUD and related HTTP endpoints
 * @dependencies PrismaService
 * @entrypoints POST /users, GET /users/:id
 */
```

Keep entries **accurate** when refactoring — stale metadata is worse than none.

## Testing

- **Unit**: services with mocked `PrismaService` (or repository ports).
- **E2E**: `supertest` against `INestApplication` with test DB or containerized Postgres.
