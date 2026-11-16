# Case study: multi-tenant operations dashboard

## The problem

A B2B operations team needs one dashboard where a person can belong to several
organizations with a different role in each, see only the active tenant's data,
and trust that permission changes and task updates are auditable.

This is a portfolio project, built to demonstrate Senior/Staff-level frontend
and platform engineering, not a commercial product.

## Constraints

- One deployable Next.js app on Vercel.
- PostgreSQL on Neon; no managed auth vendor.
- Tenant isolation must be enforced server-side, never by a client-selected id.
- Demo must be cheap to operate and safe to expose publicly.
- Every claim must be reproducible from a command or a link.

## Architecture

- Next.js 15 App Router, React 19, TypeScript strict.
- Server Components for data, small client boundaries for interaction.
- Custom JWT (`iss`, `aud`, `jti`) backed by revocable `Session` rows.
- Prisma with versioned migrations; production migrations run in the Vercel
  build only when `VERCEL_ENV=production`.
- Cursor pagination ordered by `updatedAt + id`, composite indexes, cached
  `totalCount`.
- TanStack Query with server prefetch/hydration, optimistic mutations and
  `AbortController`.
- Edge middleware is a UX gate and header layer; it makes no security decision.

## Decisions and trade-offs

| Decision | Why | Cost |
|---|---|---|
| Custom JWT instead of an auth vendor | Control, edge compatibility, session revocation | SSO/SAML needs a managed provider later |
| HttpOnly `active_org` cookie | Tenant selection survives reloads without client trust | Must re-validate membership on every request |
| Cursor-only task listing | No deep offsets, stable pages | No random page jumps |
| Cached KPI counts | Avoid repeated aggregate queries | Coarse tag; documented invalidation |
| No OTel SDK in Edge | `@vercel/otel` raised middleware from 38 kB to 97 kB | External tracing requires a DSN |
| Production-only migrations | Previews must not mutate production | Preview DBs need their own migration path |

## Results

- Live deployment with CSP nonce, HSTS, COOP/CORP, request IDs and health check.
- 115 automated tests (94 unit, 21 E2E), 92.68% statement coverage in `lib/` and
  critical hooks.
- Warm p95 180 ms for tasks at 10 VUs, 0% errors; cold-start p95 310 ms.
- Middleware 33.8 kB.
- Cross-tenant mutation returns 403; last-admin demotion is blocked in a
  serializable transaction.
- Audit events for task status and membership role changes.
- ADRs and a runbook for deploy, rollback and incident signals.

## What I would do next

1. Connect Sentry/OTel with a real DSN and show a captured issue with request id.
2. Add invitations and SSO through a managed provider (WorkOS/Auth.js).
3. Add visual regression and contract tests in CI.
4. Run a larger k6 profile and publish the p95/error-rate chart.

## What this demonstrates

**Senior frontend:** React Server Components, streaming, optimistic UI,
accessibility, testing and performance.

**Technical lead:** explicit decisions, failure modes, rollout and rollback.

**FDE:** a deployable system with migrations, health checks, observability
signals and a customer-ready demo path.
