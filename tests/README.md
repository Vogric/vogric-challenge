# E2E Tests

## Requirements

1. Copy `.env.example` to `.env.local` and complete:
   - `DATABASE_URL` (PostgreSQL)
   - `JWT_SECRET` (minimum 32 characters)

2. Start PostgreSQL (if not running locally):
   ```bash
   docker compose up -d
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

4. Run the seed (idempotent, creates demo user and test data):
   ```bash
   npm run seed
   ```

5. Run tests:
   ```bash
   npm run test:e2e
   ```

   UI mode:
   ```bash
   npm run test:e2e:ui
   ```

## Demo User

- Email: `demo@example.com`
- Password: `password123`