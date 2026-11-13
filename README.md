# SaaS Dashboard

A multi-tenant B2B administration panel built with **Next.js 15 (App Router), React 19, TypeScript and Prisma/PostgreSQL**. It is a portfolio project, and it is written the way a production service would be: versioned migrations, a security model with tests behind it, and no claim in this document that the code does not back.

**Live demo:** <https://vogric-challenge.vercel.app> · sign in with `demo@example.com` / `password123`

![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)
![Tests](https://img.shields.io/badge/Tests-105%20passing-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## Who should read what

Four different people open this repository and none of them wants the same page. Start where you fit.

| If you are… | Read | You will learn in |
|---|---|---|
| **Recruiter / hiring manager** | [What this is](#what-this-is) → [60-second tour](#60-second-tour) → [What it demonstrates](#what-it-demonstrates) | 3 minutes |
| **Senior engineer** | [Architecture](#architecture) → [Security model](#security-model) | 8 minutes |
| **Staff engineer** | [Decisions and trade-offs](#decisions-and-trade-offs) → [Known gaps](#known-gaps) | 10 minutes |
| **Forward Deployed Engineer** | [Verification](#verification-how-to-reproduce-it) → [Operations](#operations) → [Known gaps](#known-gaps) | 8 minutes |

Every number in this document was produced by running the command next to it. Where something is not covered, it says so.

---

## What this is

A dashboard where a user belongs to several organizations with a different role in each, and sees only the data of the organization they are currently working in.

Five screens:

| Screen | Route | What it is |
|---|---|---|
| Login | `/auth/login` | Credential sign-in, accessible form, server-side session |
| Overview | `/dashboard` | KPI counters for the active organization |
| Tasks | `/dashboard/projects` | Cursor-paginated task table with inline status editing. Reached from the **Projects** tab above the content, or by URL |
| Team | `/dashboard/members` | Members and role management (admins only) |
| Settings | `/dashboard/settings` | Read-only account and workspace summary |

**Demo accounts** (created by the seed):

| Account | Password | Acme Corp | Globex | Initech |
|---|---|---|---|---|
| `demo@example.com` | `password123` | ADMIN | MANAGER | VIEWER |
| `viewer@example.com` | `password123` | — | — | VIEWER |

Signing in as `demo`, switching organization in the sidebar, and opening **Tasks** is the fastest way to see the tenancy model in action: the same user gets different permissions in each organization.

## 60-second tour

1. Sign in as `demo@example.com`.
2. The overview shows counters for **Globex**, where the user is a MANAGER.
3. Switch to **Acme Corp** in the sidebar. The counters change and the role line says `signed in as admin`.
4. Open **Tasks**. Change a status. The row updates immediately (optimistic), and the overview counters are invalidated server-side.
5. Switch to **Initech** (VIEWER) and try the same. The request is rejected with a 403, the optimistic row reverts, and a notification says why. The UI does not pre-disable the control: the API is the authority.
6. Open **Team** in Acme Corp: role controls appear. As a VIEWER in Initech, they do not.

## What it demonstrates

| Area | How it shows up | Where |
|---|---|---|
| Multi-tenant authorization | Every mutation re-derives the organization from the resource, then checks the actor's membership in *that* organization | `app/api/**/route.ts`, `lib/authz.ts` |
| React data patterns | Optimistic update with rollback on failure, partitioned contexts, hydrated server cache | `hooks/useTasks.ts`, `contexts/` |
| Next.js App Router | Server Components by default, streaming with `<Suspense>`, server-state hydration, edge middleware as a cheap gate | `app/`, `middleware.ts` |
| Type-safe contracts | Zod schemas as the single source of truth for input **and** output; zero `any` in the codebase | `lib/validations/` |
| Database design | Versioned migrations, a real enum for task status, indexes chosen for the query patterns | `prisma/` |
| Testing | Unit, integration and E2E layers, including a cross-tenant isolation test and an accessibility gate | `**/__tests__/`, `tests/e2e/` |
| Operations | Health endpoint, structured logs, request correlation, runbook, fail-fast boot check | `instrumentation.ts`, `docs/runbook.md` |

---

## Quick start

**Requirements:** Node.js 20+, PostgreSQL 16 (local or Neon).

```bash
npm ci
cp .env.example .env.local      # fill in DATABASE_URL and JWT_SECRET (>= 32 chars)
npx prisma migrate deploy       # or `prisma migrate dev` while developing
npm run seed
npm run dev                     # http://localhost:3000
```

Generate a session secret with `openssl rand -base64 48`.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + `next build` (runs `prisma migrate deploy` first when `VERCEL_ENV=production`) |
| `npm run start` | Serve a production build |
| `npm test` | Unit and integration tests (Vitest, 89 tests) |
| `npm run test:coverage` | The same suite plus the coverage gate |
| `npm run test:e2e` | Playwright against an isolated test database (16 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with `--max-warnings=0` |
| `npm run seed` | Idempotent fixtures: 3 organizations, 2 users, 15 projects, 60 tasks |

---

## Architecture

### Data model

```
User ──< Membership >── Organization ──< Project ──< Task
              │                                        │
        role: ADMIN | MANAGER | VIEWER          status: enum (todo, in_progress, done)
        unique(userId, organizationId)          indexed on (projectId, updatedAt), status, assigneeId
```

`Session` holds one row per signed-in device, keyed by the JWT's `jti`, which is what makes logout and revocation actually revoke something.

### Request lifecycle

```
Request
  └─ middleware.ts            cookie presence, CSP nonce, request id, login rate limit
      └─ Server Component     resolves the session against the database (source of truth)
          └─ API route        re-resolves the session, then checks membership of the resource's org
```

The middleware deliberately makes **no** security decision: it runs on the edge without database access, so it cannot tell a live session from a revoked one. Every page and route handler revalidates. The reasoning is in [ADR 0006](./docs/adr/0006-edge-middleware-makes-no-security-decisions.md).

### Rendering and caching

| Surface | Strategy | Why |
|---|---|---|
| KPI counters | `unstable_cache`, tag `org-stats`, 5-minute TTL **plus** `revalidateTag` on every task mutation | Identical for everyone in the organization; a write must not wait for a TTL |
| Task list | Never cached (`no-store`), cursor paginated | Per-request, per-tenant data |
| Pages | `force-dynamic` | The active organization lives in a cookie |
| Page shell | Streamed with `<Suspense>` | Headings and layout paint before Postgres answers |
| Session lookup | `cache()` per request | The layout and the page inside it both need the user |

### Repository map

```
app/            App Router: pages, route handlers, layouts
  (auth)/       Unauthenticated routes
  (dashboard)/  Authenticated shell, resolved session
  api/          Route handlers (JSON)
components/     UI, grouped by feature; ui/ holds the primitives
contexts/       Auth, theme, notifications, workspace transition
hooks/          Data hooks (TanStack Query) and UI hooks
lib/            Auth, tenancy, pagination, rate limiting, validation, logging
prisma/         Schema, migrations, seed
tests/e2e/      Playwright specs and the isolated-database setup
docs/           ADRs, runbook, security and performance notes
```

---

## Decisions and trade-offs

The six decisions worth arguing about, and what each one cost. Full context in [`docs/adr`](./docs/adr/README.md).

| Decision | What we gained | What we gave up |
|---|---|---|
| Custom JWT (`jose`) + revocable DB session, instead of a third-party auth SDK | Full control over the cookie, the claims and revocation; no vendor lock | Password reset, OAuth, email verification are ours to build |
| Cursor (keyset) pagination only | Stable pages while rows are edited; no deep-offset scans | No "jump to page 7"; page numbers in the UI are counted, not authoritative |
| Partitioned Context instead of Zustand/Redux | No extra dependency, no provider soup, native | Server state and client state are two different tools here; that split has to be taught |
| KPI counts cached with a coarse tag | A mutation never serves a stale number | Mutating one organization drops the counters for all of them; per-organization tags need a Next canary |
| Edge middleware as a gate, not an authority | No cryptography on every request; no false sense of security | A revoked cookie costs one render before the redirect |
| `Serializable` transaction for the "last admin" rule | Two concurrent demotions cannot leave an organization with zero admins | Needs retry logic on write conflicts (`lib/db-tx.ts`) |

---

## Security model

| Control | Implementation |
|---|---|
| Session | JWT (HS256, pinned algorithm, 7-day expiry) in an `HttpOnly`, `SameSite=Lax`, `Secure`-in-production cookie, backed by a `Session` row for revocation |
| Secret handling | `lib/jwt.ts` refuses to start without a ≥32-character secret; no fallback value exists |
| Tenant isolation | The organization is derived from the resource (`task.project.organizationId`), never from the request body |
| Roles | `VIEWER` reads; `MANAGER` and `ADMIN` change task status; only `ADMIN` changes roles |
| Last admin | Enforced inside a `Serializable` transaction, so it cannot be raced |
| CSRF | `Origin` / `Sec-Fetch-Site` validation on all six mutating endpoints, no exceptions |
| Rate limiting | Login 5/min per IP in production, 30/min for the vitals endpoint; Upstash Redis when configured, per-instance fallback otherwise |
| Headers | CSP with a per-request nonce (`strict-dynamic`), HSTS, `X-Frame-Options: DENY`, `nosniff`, `COOP`/`CORP` |
| Error surface | Generic messages to clients; details go to structured logs with a request id |

The authorization tests are the interesting ones: `tests/e2e/tenant-isolation.spec.ts` signs in as a viewer and tries to mutate another tenant's task, and `app/api/**/__tests__` covers the role matrix per endpoint (anonymous, missing membership, wrong role, foreign resource, last admin).

---

## Verification: how to reproduce it

Everything below was executed on the commit in this branch.

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | 0 errors |
| Lint | `npm run lint` | 0 errors, 0 warnings (`--max-warnings=0`) |
| Unit / integration | `npm test` | **89 passed** in 15 files |
| Coverage | `npm run test:coverage` | **92.12% statements · 81.29% branches · 95.45% functions** (gate: 80/70/80) |
| End-to-end | `npm run test:e2e` | **16 passed** |
| Production build | `npm run build` | OK · First Load JS 103 kB · middleware 35.5 kB |

The E2E suite needs its own database and refuses to run against anything whose name does not contain `test`:

```bash
createdb saas_dashboard && createdb saas_dashboard_test
# .env.local: DATABASE_URL and DATABASE_URL_TEST (the latter must contain "test")
npx playwright install chromium
npm run test:e2e
```

**What the E2E suite covers:** login (valid, invalid, client-side validation), the middleware gate, logout, an authenticated visitor landing back on the login page, real counters read from the isolated database, organization switching, members and role controls, settings, mobile navigation, the paginated task table, a cross-tenant mutation returning 403, and two axe accessibility scans (dashboard and tasks) that fail on any `critical` or `serious` violation.

**What is *not* covered**, stated on purpose:

- Visual regression, load testing, and contract tests against a deployed environment.
- The migration was verified against a database with real rows (three legacy statuses survived, an invalid value fails loudly), but not against a large locked table.
- Route handlers are covered by their own authorization tests, which sit outside the `lib/` coverage gate.

---

## Operations

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | ≥ 32 characters; the boot check refuses to start without it |
| `DATABASE_URL_TEST` | E2E only | Must contain `test`; the global setup resets it |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | no | Distributed rate limiting; without them the limiter degrades to per-instance counters and logs that it did |

- **Migrations** are versioned in `prisma/migrations`. `scripts/vercel-build.mjs` applies them only when `VERCEL_ENV=production`, so previews never touch the production schema.
- **Health**: `GET /api/health` returns `200` with `database: connected`, or `503` when Postgres is unreachable.
- **Logs**: one JSON line per event with `level`, `event`, `timestamp` and `requestId`. `instrumentation.ts` fails fast on missing configuration and reports unhandled request errors through the same `requestId` the middleware assigns.
- **Runbook**: [`docs/runbook.md`](./docs/runbook.md) has the deploy checklist, the rollback path and the migration procedure.

---

## Known gaps

No known defect is hidden here. Each of these is a deliberate scope boundary or an upstream limitation, with the reason.

| Gap | Status | Why |
|---|---|---|
| No internationalization; UI strings are hardcoded English | Accepted | Scope for a single-locale demo; the plumbing (one strings module) would be the first step |
| Naming drift: route `/dashboard/projects`, link *Projects*, heading *Tasks* | Accepted | The page lists tasks; the route is the legacy name. Renaming it touches both navs and the E2E specs for no user-visible gain |
| Login is not constant-time for unknown emails | Known | bcrypt only runs for existing accounts, so response timing leaks account existence; the fix is a placeholder hash, ~6 lines |
| Per-organization cache tags | Blocked upstream | `use cache` + `cacheTag` need `experimental.cacheComponents`, which Next 15.5 rejects outside canary |
| No Partial Prerendering | Blocked upstream | Same version gate |
| Middleware runs on `/api/*` to propagate the request id | Accepted | Narrowing the matcher loses log correlation; see [ADR 0006](./docs/adr/0006-edge-middleware-makes-no-security-decisions.md) |
| No performance budget in CI | Planned | No bundle-size or Lighthouse gate on pull requests |
| Password reset, email verification, OAuth | Out of scope | The session layer supports them; the flows do not exist |

---

## Documentation

| Document | For |
|---|---|
| [`docs/adr/`](./docs/adr/README.md) | Six architecture decision records: JWT sessions, active-organization cookie, cursor pagination, observability, single pagination path, middleware |
| [`docs/runbook.md`](./docs/runbook.md) | Deploy, migrate, roll back |
| [`docs/security.md`](./docs/security.md) | Threat notes and the production auth checklist |
| [`docs/performance.md`](./docs/performance.md) | Rendering and caching strategy in detail |
| [`docs/observability.md`](./docs/observability.md) | Log events, request correlation, health checks |

## License

Personal portfolio project. © 2026 Braian Vogric. All rights reserved.
