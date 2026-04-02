# Project: nestjs-agent

NestJS **10** REST API on **Express**, TypeScript with strong checks (`strictNullChecks`, `noImplicitAny`, and related flags in `tsconfig.json`).

## Package manager

Use **pnpm** only (`packageManager` and `pnpm-lock.yaml` are canonical). Prefer `pnpm run <script>` or `pnpm <script>` for defined scripts. Use `pnpm exec <bin>` for one-off CLIs (for example `pnpm exec nest`, `pnpm exec prisma`).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | NestJS 10 + `@nestjs/platform-express` |
| Language | TypeScript 5.x |
| HTTP validation | `class-validator`, `class-transformer`, `ValidationPipe` |
| Config / env | `@nestjs/config`, Joi |
| Persistence | PostgreSQL via **Prisma** (`prisma/schema.prisma`, migrations under `prisma/migrations/`) |
| Cache / rate limiting | Redis (`ioredis`), `@nestjs/throttler`, `@nest-lab/throttler-storage-redis` |
| Logging | `nestjs-pino`, `pino`, `pino-http` |
| Lint / format | ESLint 8 + **Biome** (`format`, `check`, `check:ci`) |
| Infra (dev) | Docker Compose + `scripts/dev-infra-up.sh` (`pnpm run infra:up`; also runs on `pnpm install` via `prepare`) |

### Testing (target tooling)

Unit tests with **Jest** and e2e with **Jest** + **Supertest** match the usual NestJS setup, but **`test` / `test:e2e` scripts are not defined in `package.json` yet**. Add them when you introduce `test/` and Jest config (for example `nest new`–style `jest` + `test/jest-e2e.json`).

## Commands

Scripts below match **`package.json`** as of this document.

### Application

| Command | Description |
|---------|-------------|
| `pnpm run start:dev` | Dev server with watch (`nest start --watch`) |
| `pnpm run start` | Start without watch |
| `pnpm run start:debug` | Debug + watch |
| `pnpm run start:prod` | Run compiled app (`node dist/main`) |
| `pnpm run build` | Compile (`nest build`) |

### Quality

| Command | Description |
|---------|-------------|
| `pnpm run lint` | ESLint on `src`, `apps`, `libs`, `test` |
| `pnpm run format` | Biome format write |
| `pnpm run format:check` | Biome format check |
| `pnpm run check` | Biome check (write) |
| `pnpm run check:ci` | Biome CI mode |

### Database (Prisma)

| Command | Description |
|---------|-------------|
| `pnpm run prisma:generate` | `prisma generate` |
| `pnpm run prisma:migrate` | `prisma migrate dev` |
| `pnpm run prisma:studio` | `prisma studio` |

### Infrastructure (local)

| Command | Description |
|---------|-------------|
| `pnpm run infra:up` | Bring up dev dependencies (see `scripts/dev-infra-up.sh` / `docker-compose.yml`) |

### Nest CLI (scaffolding)

Run via `pnpm exec` so the local CLI is used:

| Command | Description |
|---------|-------------|
| `pnpm exec nest g module <name>` | Generate a module |
| `pnpm exec nest g service <name>` | Generate a service |
| `pnpm exec nest g controller <name>` | Generate a controller |

### Testing (once Jest is added)

| Command | Description |
|---------|-------------|
| `pnpm run test` | Run unit tests *(add script when Jest is configured)* |
| `pnpm run test:e2e` | Run e2e tests *(add script when e2e is configured)* |

## Related docs

- [`../AGENTS.md`](../AGENTS.md) — agent-oriented boundaries and checklists
- [`architecture.md`](architecture.md) — layers and request lifecycle
- [`conventions.md`](conventions.md) — naming and folders
- [`dependency-map.md`](dependency-map.md) — module and external dependencies
