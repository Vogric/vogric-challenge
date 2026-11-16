import { execFileSync } from 'node:child_process'

function migrationEnvironment() {
  // Neon pooled connections can be slow to acquire Prisma's migration advisory
  // lock. If the project exposes the direct URL, migrations should use it.
  const directUrl = process.env.DATABASE_URL_UNPOOLED
  return directUrl ? { ...process.env, DATABASE_URL: directUrl } : process.env
}

function run(command, args, env = process.env) {
  execFileSync(command, args, { stdio: 'inherit', env })
}

function schemaStatus(env) {
  try {
    return execFileSync('npx', ['prisma', 'migrate', 'status'], {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    // A non-zero status means drift, a pending migration, or an unreachable
    // database. In all three cases we must fall through to deploy so the build
    // fails closed instead of shipping code against an unknown schema.
    return null
  }
}

function deployMigrations(env) {
  const status = schemaStatus(env)
  if (status && /Database schema is up to date/i.test(status)) {
    console.log('[build] Prisma schema is already current; skipping migrate deploy.')
    return
  }

  console.log('[build] Applying Prisma migrations to the production database...')
  run('npx', ['prisma', 'migrate', 'deploy'], env)
}

// Vercel sets VERCEL_ENV=production only for production deployments.
// Preview and development deployments must not mutate the production database.
if (process.env.VERCEL_ENV === 'production') {
  deployMigrations(migrationEnvironment())
}

run('npx', ['prisma', 'generate'])
run('npx', ['next', 'build'])
