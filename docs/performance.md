# Performance model

## Task pagination

`GET /api/dashboard/tasks` supports two modes:

- **Cursor (default for the UI):** `?orgId=...&pageSize=50&cursor=<opaque>`.
  Results are ordered by `updatedAt DESC, id DESC`; the response includes
  `pagination.nextCursor` and `hasNextPage`. This avoids deep `OFFSET` scans.
- **Offset (legacy):** `?orgId=...&page=1&pageSize=50`. Kept for API
  compatibility and existing consumers.

The cursor is an opaque base64url value containing `updatedAt` and `id`. It is
validated server-side; malformed cursors return `400`.

## Indexes

- `Task(projectId, updatedAt)` supports the ordered cursor query.
- `Task(status)` supports pending-task counts.
- `Membership(organizationId)` supports Members and organization counts.

## Remaining work

`totalCount` is cached per organization for 30 seconds in-process. Status updates
do not invalidate it because they do not change the row count. A future
create/delete endpoint must call `clearTaskCountCache()` (or replace the cache
with a distributed store) after mutating tasks. The page query itself is already
cursor-based.


## Live measurement (2026-11-16)

Deployment: `a05cb1f`, functions `fra1`, Neon `eu-central-1`.

```text
k6 · 10 VUs · 20 s
warm p95:      180 ms
warm median:   124 ms
cold p95:      310 ms
error rate:    0.00%
```

The cold-start run includes serverless initialization; steady state is well
under the 300 ms threshold. This is why the endpoints use `preferredRegion =
'fra1'`.
