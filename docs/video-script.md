# 2-minute demo video script

Target: recruiters and hiring managers. Record 1440×900, browser zoom 110%,
bookmarks hidden, notifications off. No background music.

## 0:00–0:10 — Hook

**Screen:** live dashboard.

**Voice:** “This is a multi-tenant B2B dashboard: one user, several
organizations, different permissions in each. Next.js 15, React 19, Prisma on
Neon, deployed on Vercel.”

## 0:10–0:30 — Login and workspace

**Action:** open `/auth/login`, sign in as `demo@example.com`.

**Voice:** “The login has explicit pending feedback. The session is an HttpOnly
JWT with a database-backed `jti`, so logout revokes it server-side.”

**Action:** land on the dashboard, point at the Acme counters.

## 0:30–0:55 — Organization switch

**Action:** switch Acme → Globex.

**Voice:** “The organization is not a client-trusted id. It lives in an
HttpOnly cookie and is validated against membership on every request. While
the server refreshes, the whole workspace shows a transition state.”

**Action:** switch to Initech; try to change a task.

**Voice:** “Same user, VIEWER here. The API returns 403 and the optimistic row
rolls back. The UI never pretends the mutation succeeded.”

## 0:55–1:20 — Tasks and scale

**Action:** open Projects, change a status, go to the next cursor page.

**Voice:** “Tasks use cursor pagination, not offsets. The cursor is opaque and
ordered by `updatedAt + id`; composite indexes and a short-lived count cache
keep the query predictable. Functions run in `fra1`, next to Neon.”

## 1:20–1:40 — Team and audit

**Action:** open Team, show the role control; open Audit through the ⌘K palette.

**Voice:** “Role changes are ADMIN-only, the last admin is protected by a
serializable transaction, and sensitive mutations write a tenant-scoped audit
event.”

## 1:40–1:55 — Proof

**Screen:** terminal with `npm run test:coverage`, then `k6` summary, then
`/api/health`.

**Voice:** “133 tests, a 93.41% coverage gate, axe checks, and a p95 of
189 milliseconds with zero errors.”

## 1:55–2:00 — Close

**Voice:** “The interesting part is not the dashboard. It is that tenancy,
migrations, security and failure states are explicit, tested and documented.”

**End card:** live URL + demo credentials.
