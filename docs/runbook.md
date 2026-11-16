# Production runbook

## Required environment variables
- `DATABASE_URL`
- `JWT_SECRET` (>= 32 characters)
- Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` for distributed
  rate limiting. Without them, the in-memory fallback is used.

## Deploy checklist
1. `npm ci`
2. `npx prisma migrate deploy` — apply pending migrations before the code that needs them.
3. `npm run build`
4. Verify `/api/health` returns 200 and `database: connected`.
5. Verify login, organization switch and `/dashboard/projects`.
6. Check CSP and security headers in DevTools.
7. Confirm `/api/auth/me` is `private, no-store`.
8. Confirm the boot check is satisfied: `instrumentation.ts` refuses to start without `JWT_SECRET` or `DATABASE_URL`.

## Vercel production migrations

`scripts/vercel-build.mjs` runs migrations only when `VERCEL_ENV=production`.
Before deploying, it runs `prisma migrate status`; when the schema is already
current it skips `migrate deploy`, avoiding Neon advisory-lock contention on
every build. If Neon exposes `DATABASE_URL_UNPOOLED`, the script uses that
direct connection for migrations. Preview and development builds skip
migrations, so they never mutate the production database. For a manual release,
run `npx prisma migrate deploy` before `next build`.

## Rollback
- Revert the deployment to the previous Vercel build.
- Do not roll back migrations blindly; the baseline is forward-only.
- If a session issue appears, rotate `JWT_SECRET` and force re-login.

## Incident signals
- `auth.login.failed`
- `tasks.list.failed`
- `tasks.update.failed`
- `web_vitals.metric`

All errors include `requestId` and timestamp.


## Existing database baseline adoption

If a database was created with the old migrations and the repository now uses a
squashed baseline:

1. Back up `_prisma_migrations` (read-only export).
2. Mark the baseline as applied:
   `npx prisma migrate resolve --applied 20241104120000_baseline_schema_sync`
3. Apply pending migrations:
   `npx prisma migrate deploy`
4. Verify:
   `npx prisma migrate status`

The production Neon database was reconciled with this procedure after the first
Vercel build failed with `type "Role" already exists` (P3018).
