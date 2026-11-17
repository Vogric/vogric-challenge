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


## Authenticated performance budget (2026-11-17)

`npm run perf:budget` measures every authenticated route against a local
production build. Each route has its own TTFB, LCP, CLS, and JavaScript-transfer
budget (JS < 350 kB):

```text
/dashboard          TTFB 375 ms · LCP 428 ms · CLS 0       · JS 186.0 kB
/dashboard/projects TTFB 314 ms · LCP 664 ms · CLS 0       · JS 191.4 kB
/dashboard/members  TTFB 353 ms · LCP 696 ms · CLS 0.0072  · JS 184.9 kB
/dashboard/audit    TTFB 162 ms · LCP 512 ms · CLS 0.0115  · JS 182.9 kB
/dashboard/settings TTFB 186 ms · LCP 224 ms · CLS 0       · JS 182.9 kB
```

The first route pays the shared shell and fonts; later routes reuse cached
chunks. Byte accounting falls back to `encodedBodySize` when Chromium reports a
cache hit as zero transfer size, so a warm cache cannot make the budget blindly
pass.

## Lighthouse

`npm run lighthouse:budget` runs Lighthouse against the public login page, the
one route that does not require an authenticated Playwright session:

```text
Performance      99 / 100
Accessibility   100 / 100
Best practices   96 / 100
SEO             100 / 100
FCP 758 ms · LCP 758 ms · TBT 30 ms
```

The authenticated dashboard is covered by the route budget above; Lighthouse
does not know the demo session and is intentionally not pointed at protected
pages.
