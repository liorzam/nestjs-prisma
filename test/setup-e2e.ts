import { execSync } from 'node:child_process'
import { join } from 'node:path'

/** Once per Jest worker so multiple e2e files do not re-run deploy unnecessarily. */
const g = globalThis as typeof globalThis & { __e2ePrismaMigrated?: boolean }
if (!g.__e2ePrismaMigrated) {
  g.__e2ePrismaMigrated = true
  const repoRoot = join(__dirname, '..')
  execSync('pnpm exec prisma migrate deploy', {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  })
}
