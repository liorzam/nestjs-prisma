# Project Memory & Context

Quick reference for agent-assisted development on this codebase.

## Latest work (2026-04-08)

**AppMetadata CRUD module implemented:**
- Full module in `src/modules/app-metadata/` (controller, service, DTOs, module)
- 19 unit tests (service + controller) + E2E tests with real DB
- Updated AGENTS.md, docs/conventions.md, docs/dependency-map.md
- All tests passing

## Key references

- **`AGENTS.md`** — Agent boundaries, validation/transform rules, Prisma patterns
- **`docs/conventions.md`** — DTO patterns, naming, folder structure, decorator examples
- **`docs/dependency-map.md`** — Module imports, external systems, Redis/DB patterns
- **`docs/architecture.md`** — System design, request lifecycle

## Template for new features

See `src/modules/app-metadata/` as the canonical example:

```
src/modules/<domain>/
  *.module.ts          — @Module with providers, exports
  *.controller.ts      — thin; delegates to service
  *.service.ts         — business logic, Prisma access
  *.service.spec.ts    — mocked deps, unit tests
  *.controller.spec.ts — HTTP layer, supertest
  dto/
    *.dto.ts           — input (class + validators) or response (interface)
```

Add module to `AppModule` imports. Test both unit (fast, mocked) and E2E (real DB).

## Validation quick reference

```typescript
// Input DTO = class
@IsObject()
value: Record<string, unknown>

@IsOptional()      // MUST come first
@IsString()
name?: string

@ValidateNested()
@Type(() => AddressDto)
address: AddressDto

@IsArray()
@ValidateNested({ each: true })
@Type(() => ItemDto)
items: ItemDto[]
```

## Commands

```bash
pnpm run build              # Compile
pnpm run check:ci           # Biome lint
pnpm run test               # Unit tests (fast)
pnpm run test:e2e           # E2E tests (real DB)
pnpm run start:dev          # Dev server
pnpm exec prisma migrate dev  # Create migrations
```
