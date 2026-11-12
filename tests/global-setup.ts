import { execFileSync } from 'node:child_process'
import { getTestDatabaseUrl } from './env'

/**
 * Recreates the isolated test database and seeds the minimum fixtures needed
 * by the E2E suite. Runs before Playwright starts the test server.
 */
export default async function globalSetup(): Promise<void> {
  const databaseUrl = getTestDatabaseUrl()
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    NODE_ENV: 'test',
  }

  console.log('[e2e] Preparing isolated test database (schema + fixtures)...')

  execFileSync('npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed'], {
    stdio: 'inherit',
    env,
  })

  execFileSync('npx', ['tsx', 'prisma/seed.ts'], {
    stdio: 'inherit',
    env,
  })

  console.log('[e2e] Test database ready.')
}
