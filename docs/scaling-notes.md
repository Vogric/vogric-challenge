# Scaling notes

These are the deliberate next moves if the product grows beyond the current
demo scale. They are engineering notes, not claims that the demo already
implements them.

## Read path

- The task count cache is process-local, TTL 30 s, capped at 500 filter
  signatures. Move it to Redis/Upstash with a key derived from
  `organizationId + filter signature`, and invalidate on task mutations.
- Add stampede protection around expensive counts (`SETNX`/single-flight) before
  increasing cache TTL.
- Consider a materialized read model for dashboard KPIs if the number of
  projects/tasks per tenant grows into the millions.

## Search and pagination

- `title contains` is fine at demo scale but has no useful index for substring
  search. At larger scale, add PostgreSQL `pg_trgm` + GIN, or a dedicated search
  index, and keep the cursor contract (`updatedAt + id`).
- The UI renders 50 rows by design. If page size grows, add row virtualization
  rather than increasing the DOM size.
- Audit is intentionally capped at the latest 100 events; add cursor pagination
  and retention/partitioning before that cap becomes a product limit.

## Writes and audit

- Status changes and their audit event already share a transaction. For
  analytics or external consumers, add a transactional outbox instead of writing
  directly to a queue from the request path.
- Keep audit records append-only. If retention is required, archive partitions
  instead of mutating historical rows.

## Rate limiting and sessions

- The local limiter is a degraded-mode fallback. Production should use Upstash
  with per-IP login limits and per-user mutation limits.
- Session validation currently performs a database lookup per authenticated
  request. At high request volume, cache session validity with a short TTL and
  publish revocation events; never cache beyond the revocation window.
- Add a cleanup job for expired sessions and abandoned memberships.

## Operations

- `scripts/vercel-build.mjs` checks `migrate status` and uses
  `DATABASE_URL_UNPOOLED` when available. Keep migrations out of previews and
  require a backup before destructive schema changes.
- Add Sentry/OTel with request IDs, traces, and SLO dashboards. Web Vitals alone
  is not incident response.
- Add canary/rollback steps to the runbook before enabling automatic production
  deploys for every commit.
- Run a larger k6 profile (100+ VUs) against staging and track database
  connection saturation, not just HTTP p95.

## Product boundaries

- Invite/SSO should be implemented through a managed identity provider
  (WorkOS/Auth.js), not hand-rolled.
- Per-org cache tags are not available in the current Next version; a Redis
  cache keyed by organization is the pragmatic alternative until upgrading.
- Keep the API contracts validated with Zod; add contract tests against the
  deployed environment before exposing the API to external clients.
