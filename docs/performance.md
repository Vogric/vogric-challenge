# Performance model

## Task pagination

`GET /api/dashboard/tasks` supports two modes:

- **Cursor (default for the UI):** `?orgId=...&pageSize=50&cursor=<opaque>`.
  Results are ordered by `updatedAt DESC, id DESC`; the response includes
  `pagination.nextCursor` and `hasNextPage`. This avoids deep `OFFSET` scans.
- **Offset (legacy):** `?orgId=...&page=1&pageSize=50`. Kept for API
  compatibility and existing consumers.

Search, status, and project filters are applied in the same Prisma query; the
count cache key includes the filter signature, so a filtered page can never use
an unfiltered total.

The cursor is an opaque base64url value containing `updatedAt` and `id`. It is
validated server-side; malformed cursors return `400`.

## Indexes

- `Task(projectId, updatedAt)` supports the ordered cursor query.
- `Task(status)` supports pending-task counts.
- `Membership(organizationId)` supports Team and organization counts.

## Remaining work

`totalCount` is cached per organization for 30 seconds in-process. Status updates
do not invalidate it because they do not change the row count. A future
create/delete endpoint must call `clearTaskCountCache()` (or replace the cache
with a distributed store) after mutating tasks. The page query itself is already
cursor-based.


## Live measurement (2026-11-16)

Deployment: `a05cb1f`, functions `fra1`, Neon `eu-central-1`.

```text
k6 · 10 VUs · 20 s (baseline)
warm p95:      180 ms
warm median:   124 ms
cold p95:      310 ms
error rate:    0.00%
```

## Larger live profile (2026-11-16)

`load/tasks.js` with 20 VUs for 30 seconds against the production alias:

```text
checks:        1062 / 1062 passed
iterations:    531
tasks p95:     189.44 ms (threshold < 300 ms)
tasks median:  130.94 ms
error rate:    0.00%
```

This is read-only traffic against the Acme tenant. The script logs in once in
`setup()`, reuses the session cookie, and asserts both HTTP 200 and the presence
of the `tasks` array in every response.

The cold-start run includes serverless initialization; steady state is well
under the 300 ms threshold. This is why the endpoints use `preferredRegion =
'fra1'`.


## Authenticated performance budget (2026-11-16)

Measured with `npm run perf:budget` against a local production build, from login
through the dashboard:

```text
PASS  TTFB:        5 ms        (budget 800 ms)
PASS  LCP:        44 ms        (budget 2500 ms)
PASS  CLS:         0           (budget 0.1)
PASS  JS transfer: 197.0 kB    (budget 600 kB)
INFO  authenticated navigation: 2277 ms · 38 requests · 362.7 kB total
```

`authenticatedNavigationMs` includes the login POST, redirect, dashboard data
fetch, and a 1.5 s settle window; it is not LCP. The budget is deliberately
generous enough for CI variance while still catching a JavaScript regression.
