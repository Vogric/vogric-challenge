# E2E Tests

## Requirements

1. Copy `.env.example` to `.env.local` and complete:
   - `DATABASE_URL` (development database)
   - `DATABASE_URL_TEST` (isolated database; its name **must** contain `test`)
   - `JWT_SECRET` (minimum 32 characters)
   - `NEXTAUTH_SECRET` (minimum 32 characters)

2. Create the isolated local database once (example with local PostgreSQL):
   ```bash
   createdb -U saas saas_dashboard_test
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

4. Run tests:
   ```bash
   npm run test:e2e
   ```

   The global setup runs `prisma migrate reset --force --skip-seed` and the seed against
   `DATABASE_URL_TEST` on port `3100`. It never reuses the development server
   and refuses to reset a database whose name does not contain `test`.

   UI mode:
   ```bash
   npm run test:e2e:ui
   ```

## Isolated server

- URL: `http://localhost:3100`
- Database: `DATABASE_URL_TEST`
- Seed: 3 organizations, 15 projects, 60 tasks (20 per organization); the
  2,000-task bulk block is skipped when `NODE_ENV=test`.

## Demo User

- Email: `demo@example.com`
- Password: `password123`
