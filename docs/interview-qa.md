# Interview Q&A

Short, defensible answers for Staff/FDE interviews. Each answer separates what
is implemented, which trade-off was chosen, and what the next step would be.
The technical scaling path lives in [scaling-notes.md](./scaling-notes.md).

Use this as a starting point, not a script. If an important question is still
open after the demo and these notes, that is useful feedback: it tells us where
the project needs more depth and where the next conversation should go.

## Architecture and Staff-level judgment

### 1. What problem does this project solve?

A multi-tenant operations dashboard: authentication, organization membership,
RBAC, task browsing/filtering, audit history, settings, and deployment. It is a
small product slice chosen to show end-to-end judgment, not a UI-only demo.

### 2. Why custom JWT instead of Auth.js/Clerk/WorkOS?

Control over revocation and edge behavior. The JWT carries `iss`, `aud`, and
`jti`; sessions are Postgres rows, so logout and role changes invalidate access.
For enterprise SSO/SCIM I would use WorkOS/Auth.js rather than hand-roll it —
see ADR 0007.

### 3. Why doesn't middleware verify the session?

Middleware runs on Edge and cannot query Postgres. A signature check there would
duplicate work and still not be authoritative. It is a cheap UX gate; every Node
route and Server Component re-derives the user and session. ADR 0006.

### 4. How do you prevent cross-tenant access?

The organization comes from the resource (`task → project → organization`), not
from the request body. The actor's membership is checked before mutations.
`tests/e2e/tenant-isolation.spec.ts` proves a viewer from another tenant gets
403.

### 5. How do you protect the last admin?

`runSerializable` wraps the admin count and role update in one serializable
transaction, retries `P2034`, and returns 400 if the organization would lose its
last admin. See `lib/db-tx.ts` and the members API.

### 6. Why cursor pagination instead of offset?

Stable results under concurrent writes and no deep-offset scan. The cursor is
opaque (`updatedAt + id`), the query fetches `pageSize + 1`, and the UI keeps a
cursor history for Previous. The count is cached separately.

### 7. How does cache invalidation work?

KPI counts use `unstable_cache` with a coarse `org-stats` tag. Next 15.5's
stable API cannot use per-org tags, so a mutation in one organization drops the
KPI cache for all organizations. Recomputing three counts is cheaper than
serving stale numbers; TTL is the backstop. See `lib/cache-tags.ts`.

### 8. How would you scale the cache?

Move the count cache to Redis with a key derived from organization and filter
signature, invalidate on task mutations, and add single-flight/stampede
protection. The current in-process cache is bounded to 500 entries and is a
deliberate single-instance fallback.

### 9. Why is audit inside the task transaction?

The status update and audit event are one unit. If audit insertion fails, the
transaction rolls back instead of leaving a changed row with no actor trail.
Audit metadata is parsed by action with Zod (`task.status_changed`,
`membership.role_changed`) with a typed raw fallback for future events.

### 10. What happened with the production migration incident?

The baseline had not been marked and legacy rows made the first deploy fail
with `P3018`. I backed up migration state, reconciled the production history,
marked the baseline, deployed, and documented the procedure in the runbook. The
build now checks `prisma migrate status` and skips `migrate deploy` when the
schema is current, avoiding Neon advisory-lock contention.

### 11. What would you change before 10x traffic?

Distributed rate limiting and cache, search indexing (`pg_trgm`/GIN), audit
retention/pagination, read replicas or a read model for KPIs, and real
observability with SLOs. The demo's boundaries are documented; it does not
pretend to be a multi-region service.

### 12. How do you know the frontend is maintainable?

Pages are composition-only (≤100 lines); non-page source files are ≤150 lines;
reusable helpers are single-function modules; strict TypeScript and typed ESLint
run in CI; visual, axe, cross-browser, and component tests cover the surfaces.
`npm run verify` is the local gate.

## Vercel / Next.js

### 13. Where are the Server/Client boundaries?

Server Components by default. `'use client'` is limited to providers, the
interactive task table, organization switcher, command palette, theme, and
forms. The server owns auth and membership; the client never receives a trusted
organization id.

### 14. How do you avoid an auth waterfall?

The dashboard layout resolves the user once and hydrates the auth provider. The
client does not call `/api/auth/me` on mount. The login route lives outside that
provider.

### 15. Why is the theme applied by an inline script in the root layout?

It runs before paint to avoid a theme flash. The script is static and trusted,
receives the CSP nonce, and shares its storage key with `ThemeProvider`. The
trade-off is that `headers()` makes the root dynamic; acceptable for this
auth-heavy app.

### 16. How is CSP implemented?

Production middleware mints a nonce, builds a strict CSP, and forwards the nonce
to the document. Next scripts and the theme bootstrap receive it. Development
skips CSP so HMR works. The CSP is verified against a production build.

### 17. How do you handle serverless cold starts and regions?

API routes set `preferredRegion = 'fra1'` to sit next to Neon `eu-central-1`.
The k6 run measured a cold p95 baseline separately; the warm 20-VU run was p95
189 ms. A latent cold-start penalty remains a documented trade-off.

### 18. How is the bundle controlled?

`perf:budget` measures authenticated routes (LCP, CLS, TTFB, JS transfer) with
per-route budgets; Lighthouse gates the public login page. Current login scores
are 99 performance, 100 accessibility, 96 best practices, 100 SEO.

### 19. How is environment configuration validated?

`instrumentation.ts` parses the runtime env with Zod (`DATABASE_URL`,
`JWT_SECRET`, optional Upstash). Missing or malformed configuration fails at
boot, not on the first request. JWT length is also checked by `lib/jwt`.

### 20. What caching APIs are in use?

`unstable_cache` for KPI counts, TanStack Query for client data, HTTP
`no-store` for authenticated APIs, and cursor-count caching in the data layer.
There is no ISR for authenticated dashboards because tenant data must not be
shared across users.

## Reliability, scale, and operations

### 21. What are the failure modes?

Expired/revoked session → login redirect; cross-tenant mutation → 403 and
optimistic rollback; last-admin demotion → 400; organization-switch timeout →
revert; migration conflict → fail closed; DB down → `/api/health` 503 and error
boundary. See the failure table in `docs/architecture.md`.

### 22. What happens if Redis is unavailable?

Rate limiting degrades to the bounded in-memory limiter and logs a stable
`rate_limit.redis_unavailable` event. It is per-instance and weaker, but a Redis
outage must not lock every user out. Upstash is optional for the demo and
required for distributed production limits.

### 23. Is the rate limiter distributed?

Not in the demo fallback. Login and vitals use Upstash when configured; the
local fallback is capped at 5,000 keys. Production would require Upstash and a
real 429 test against the deployment.

### 24. How was load tested?

`load/tasks.js` logs in once, reuses the session, and reads the task endpoint.
The documented run was 20 VUs / 30 s: 531 iterations, p95 189 ms, median 131 ms,
0% errors. A 100+ VU staging run and a soak test are the next step.

### 25. How would you search millions of tasks?

`contains` is acceptable at demo scale but not indexed well. Add PostgreSQL
`pg_trgm` + GIN or a dedicated search index, preserving the cursor contract and
tenant filter.

### 26. How is audit history retained?

The UI intentionally shows the latest 100 events. At scale, add cursor
pagination, monthly partitions, and an archive/retention policy. Audit rows are
append-only; do not mutate history for retention.

### 27. What about backups, DR, RPO/RTO?

Neon provides managed backups, but this project has not run a restore drill.
Before claiming production readiness I would define RPO/RTO, test a point-in-time
restore, and document it in the runbook.

### 28. How do you handle dependency and vulnerability policy?

Dependabot groups npm and GitHub Actions updates. CI runs typecheck, lint, tests,
visual, browser, performance, and Lighthouse checks. Production `npm audit`
still has known advisories in transitive/runtime dependencies; upgrading them is
a separate, tested change, not something to hide.

## Security and tenancy

### 29. How is CSRF handled?

State-changing requests reject explicit cross-site origins; requests without
Origin/Sec-Fetch-Site are allowed for server-to-server use. Cookies are
`HttpOnly`, `SameSite=Lax`, and `Secure` in production.

### 30. How does logout revoke a session?

Logout deletes the session row and clears the cookie. If the DB delete fails,
the cookie is still cleared, the failure is logged, and the residual session
remains bounded by JWT/session expiry. An E2E test replays an old cookie after
logout and verifies the dashboard redirects to login.

### 31. Why compare a dummy bcrypt hash for unknown emails?

To avoid a response-time account oracle. Unknown-email and wrong-password paths
pay a comparable bcrypt cost before returning the same 401.

### 32. How is audit metadata typed?

The Prisma JSON boundary is parsed immediately with action-specific Zod schemas.
Known transitions have narrow types; unknown actions keep a typed raw record for
the details panel. Outbound `recordAuditEvent` enforces the same union.

### 33. What is not implemented in security?

SSO/SCIM/signup invites, JWT signing-key rotation, tenant data export/deletion,
and per-tenant retention. These are enterprise product work, not demo polish;
ADR 0007 records the intended identity path.

## React and frontend quality

### 34. How do you prevent optimistic-update races?

The task mutation updates the exact query cache, restores the previous value on
error, and invalidates on settle. TanStack Query cancels obsolete requests via
`AbortController`; the active query key includes filters and cursor.

### 35. Why not reset the cursor in a `useEffect`?

An effect would first request the new filters with the old cursor and then reset,
causing an extra stale request. The pagination state stores its filter signature
and derives an effective cursor, so the first request after a filter change is
already correct. `useTaskPagination` owns that logic.

### 36. How is the command palette accessible?

It is a labelled modal dialog with a labelled search field, active-descendant
listbox, arrow/Enter/Escape handling, focus containment between the search and
close controls, and focus restoration on close. Keyboard-only and axe tests
cover it.

### 37. Why TanStack Query instead of Redux/Zustand?

The hard part is server-state synchronization, not global client state. Query
keys, cancellation, optimistic rollback, and cache hydration are built in.
Adding a global store would duplicate ownership.

### 38. What is the testing pyramid?

Vitest unit/component tests for contracts and interactions; Playwright E2E for
real flows and tenancy; visual snapshots for five product screens plus login;
axe on every page; WebKit/Firefox smoke; k6 for load. The gate is
`npm run verify`, with build/performance/Lighthouse in CI.

## Forward Deployed Engineer

### 39. How would you onboard a new customer?

Today: create the organization/memberships and seed projects/tasks through the
database or an internal admin path. The next step is an invitation flow with
expiring tokens, an audit event, and a customer-admin UI. I would not expose
raw DB access to a customer-facing team.

### 40. How would you support one customer without seeing others' data?

Every query is organization-scoped; an operator should use an audited support
role scoped to one tenant, not database-wide access. The current project has no
support impersonation; adding it requires explicit consent and an audit trail.

### 41. How do you configure a customer-specific deployment?

The app uses environment-level configuration, not per-tenant feature flags. For
a real FDE deployment I would add tenant config/flags with safe defaults, a
preview/canary path, and a rollback plan. Today, per-tenant branding or custom
workflows would be a code/config change.

### 42. How do you upgrade a customer without downtime?

Deploy migrations before code, keep them backward-compatible, run `migrate
status` before applying, and roll out through a canary. The current runbook
documents migration reconciliation and production-only deploys; canary and
rollback are the next operational step.

### 43. How do you debug a customer incident?

Request IDs and structured logs identify the request path; `/api/health` checks
DB connectivity; audit events show tenant mutations. Sentry/OTel with tenant-safe
redaction is the missing piece. I would never log task titles or PII by default.

### 44. What would make this a real enterprise deployment?

SSO/SCIM, invites, tenant-level retention/export, per-tenant rate quotas,
observability with redaction, backup/restore drills, and a support-access model
with consent and audit. The product slice is deliberately small; the gaps are
listed rather than hidden.

## Questions this project does not fully answer

These are good-faith gaps. The right interview answer is to name the gap and the
next step, not to improvise a fake implementation.

| Area | Current state | Next step |
|---|---|---|
| Invitations / SSO / SCIM | ADR only | WorkOS/Auth.js |
| Distributed cache/rate limit | Optional Upstash; local fallback | Redis + production 429 test |
| External observability | Logs, request IDs, Web Vitals | Sentry/OTel + SLO dashboards |
| Audit retention/pagination | Latest 100 | Partition, cursor, archive policy |
| DR / restore | Managed backups | RPO/RTO + restore drill |
| Search at scale | `contains` | `pg_trgm`/GIN or search index |
| Load profile | 20 VUs / 30 s | 100+ VUs staging + soak |
| Contract tests | Zod runtime + local E2E | deployed API contract checks |
| Browser coverage | Chromium + WebKit/Firefox smoke | fuller matrix |
| Support access | Tenant-scoped app only | consented, audited support role |

The strongest answer is: “Here is what is shipped, here is the cost, here is the
first thing I would change at the next order of magnitude.”
