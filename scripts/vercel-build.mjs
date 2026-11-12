import { execFileSync } from 'node:child_process'

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', env: process.env })
}

// Vercel sets VERCEL_ENV=production only for production deployments.
// Preview and development deployments must not mutate the production database.
if (process.env.VERCEL_ENV === 'production') {
  console.log('[build] Applying Prisma migrations to the production database...')
  run('npx', ['prisma', 'migrate', 'deploy'])
}

run('npx', ['prisma', 'generate'])
run('npx', ['next', 'build'])
