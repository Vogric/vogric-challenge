import fs from 'node:fs'
import path from 'node:path'

/**
 * Loads a dotenv-style file without adding a dependency. Existing process.env
 * values win, which is what CI and explicit shell overrides need.
 */
export function loadEnvFile(file = '.env.local'): void {
  const filePath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(filePath)) return

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    const value = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2')
    if (process.env[key] === undefined) process.env[key] = value
  }
}

/**
 * Returns the isolated E2E database URL and refuses to continue if the
 * database name does not contain "test". This is a guardrail: the global
 * setup runs `prisma migrate reset`, so a typo must never point to a
 * real database.
 */
export function getTestDatabaseUrl(): string {
  loadEnvFile()

  const url = process.env.DATABASE_URL_TEST
  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST is not set. Add it to .env.local (and CI secrets) before running E2E tests.'
    )
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''))
  } catch {
    throw new Error('DATABASE_URL_TEST is not a valid PostgreSQL URL.')
  }

  if (!/test/i.test(databaseName)) {
    throw new Error(
      `DATABASE_URL_TEST points to "${databaseName}". The database name must contain "test" so the E2E setup can never reset a real database.`
    )
  }

  return url
}

export const TEST_SERVER_PORT = 3100
