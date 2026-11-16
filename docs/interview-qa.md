# Interview Q&A

Short answers you can defend. Each answer points to the code or ADR that backs it.

## 1. Why custom JWT instead of Auth.js/Clerk?

Control over revocation and edge behavior. Tokens carry `iss`, `aud` and `jti`;
`sessions` are rows in Postgres, so logout and role changes invalidate access.
For enterprise SSO I would use WorkOS/Auth.js — see ADR 0007.

## 2. Why doesn't the middleware verify the session?

The middleware runs on Edge and cannot query Postgres. A signature check there
would be duplicated and still not authoritative. It is a cheap UX redirect;
every Node route/page re-derives the user and session. ADR 0006.

## 3. How do you prevent cross-tenant access?

The organization comes from the resource (task → project → organization), not
from the request body. The actor's membership in that organization is checked
before any mutation. `tests/e2e/tenant-isolation.spec.ts` proves a viewer from
another tenant gets 403.

## 4. How do you protect the last admin?

`runSerializable` runs the admin count and the role update in one serializable
transaction, retries `P2034` once, and returns 400 if the count would drop to
zero. See `lib/db-tx.ts` and the members API.

## 5. How do you scale the task list?

Cursor pagination (`updatedAt + id`), `take = pageSize + 1`, composite
`Task(projectId, updatedAt)` index, cached count, and `fra1` colocation with
Neon. No deep offsets.

## 6. What happens on organization switch?

Optimistic select → POST validate membership → HttpOnly cookie → clear task
queries → `router.refresh()` → overlay until the server prop changes. A 5s
timeout reverts the select and shows an error.

## 7. How do you avoid an auth waterfall?

The dashboard layout resolves the user once and passes it as `initialData` to
the auth provider. The client does not fetch `/api/auth/me` on mount. The login
route is outside that provider.

## 8. How do you debug production?

Structured logs with `requestId`, path, route and error; `instrumentation.ts`
hooks `onRequestError`; `/api/health` checks the DB. Sentry/OTel is the next
external integration.

## 9. How are migrations deployed?

`scripts/vercel-build.mjs` runs `prisma migrate deploy` only when
`VERCEL_ENV=production`, then generate and build. Previews skip migrations so
they cannot mutate production. The runbook documents baseline reconciliation.

## 10. What did you reject?

`@vercel/otel`: it raised the Edge middleware from 38 kB to 97 kB. I kept
structured logs, request IDs and Web Vitals, and documented OTel as an external
collector integration. ADR 0004.

## 11. What is missing?

Sentry/OTel with a real DSN; invitations and SSO (ADR only); visual regression
and contract tests; a larger load profile. These are explicit gaps, not hidden.

## 12. Why should this pass a Staff bar?

Because the decisions include costs and failure modes: tenant isolation,
serializable admin guard, migration reconciliation, cache invalidation, Edge
bundle trade-off, cross-tenant tests and a runbook. The project is designed to
be operated, not just demoed.
