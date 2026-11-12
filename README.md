# SaaS Dashboard: Senior React/Next.js Demo 🚀

**Live Demo:** <https://vogric-challenge.vercel.app> · **Credentials:** `demo@example.com` / `password123`

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Tests](https://img.shields.io/badge/Tests-69%20passing-brightgreen.svg)

---

## Project Description

SaaS Dashboard is a high-performance B2B administration panel built with modern web standards. It focuses on scalability, strict type safety, and optimal user experience, featuring real-time state management, efficient data rendering, and a robust, automated testing strategy.

---

## Key Features

- **Custom JWT Authentication**: Secure, proprietary authentication flow using the `jose` library, featuring HttpOnly cookies and custom route protection middleware.
- **Optimistic UI**: Instant UI updates powered by TanStack Query v5, with automatic cache rollback to ensure data consistency in case of network failures.
- **Paginated Task Table**: Server-paginated task lists (50 rows per page) with a standard accessible table. Full virtualization is intentionally deferred until it has dedicated performance tests.
- **Partitioned State Management**: Focused, native React Contexts (Auth, Theme, Organization, Notification) optimized with `useMemo` to prevent unnecessary re-renders, avoiding heavy third-party state libraries.
- **End-to-End Type Safety**: Zod schemas acting as the single source of truth, seamlessly shared between frontend forms and backend API validations.
- **Comprehensive Testing Pyramid**: 69 automated tests (Unit, Integration, and E2E) ensuring reliability across critical business logic and user flows.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Server Components, Streaming) |
| Language | TypeScript (strict mode, zero `any`) |
| Styling | Tailwind CSS v3.4 + shadcn/ui |
| Server State | TanStack Query v5 |
| Client State | Partitioned Context API (Auth, Theme, Organization, Notification) |
| Database | PostgreSQL + Prisma ORM (versioned migrations) |
| Authentication | Custom JWT with `jose` library |
| Testing | Vitest (Unit) + Playwright (E2E) |
| CI/CD | GitHub Actions |

---

## Architecture Decisions

See [docs/adr](./docs/adr/README.md) and the [production runbook](./docs/runbook.md).

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Add your DATABASE_URL and JWT_SECRET

# 3. Run migrations and seed the database
npx prisma migrate dev
npm run seed

# 4. Start the development server
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run seed` | Seed database with demo data |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript validation |

---

## Architecture Decisions

- **Custom JWT with `jose`**: Provides full control over the authentication flow and HttpOnly cookies without relying on a heavy third-party auth layer.
- **Partitioned Context API over Zustand/Redux**: For static UI state (auth, theme, notifications), partitioned Context is sufficient, native, and avoids unnecessary bundle size.
- **Offset Pagination**: Ideal for datasets under 10k records. Cursor-based pagination is documented as the migration path for larger datasets.
- **Server Components by Default**: Minimizes client-side JavaScript bundle size and improves initial load performance.

---

## Project Structure

```text
app/           # Next.js App Router (pages, API routes, layouts)
components/    # React components (UI, layout, features)
contexts/      # Partitioned Context providers
hooks/         # Custom React hooks
lib/           # Utilities, authentication, DB, Zod validations
prisma/        # Schema, migrations, seed script
tests/         # E2E tests (Playwright) & Unit tests (Vitest)
```

---

## Testing Strategy

- **Unit Tests**: Critical pure functions (authentication, utilities, middleware).
- **Integration Tests**: Complex stateful hooks (`useTasks`, `useAuth`).
- **E2E Tests**: Complete user flows (login, dashboard navigation, protected routes).
- **Total**: 69 tests (55 unit + 14 E2E), with a 92% line/statement coverage gate on `lib/` and critical hooks., covering auth, RBAC, task pagination and the dashboard.

---

## Deployment

Deployed on Vercel with automatic preview deployments. Database hosted on PostgreSQL (Neon.tech). CI/CD pipeline via GitHub Actions runs the full test suite on every Pull Request.

---


## License

This project is a personal portfolio demonstration and is not intended for redistribution or commercial use. © 2026 Braian Vogric. All rights reserved.