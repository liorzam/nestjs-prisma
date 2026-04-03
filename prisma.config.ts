import { defineConfig } from 'prisma/config'

/** Placeholder only when DATABASE_URL is unset (e.g. `prisma generate` in a fresh clone). Runtime uses real env from Nest config. */
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/db?schema=public'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
})
