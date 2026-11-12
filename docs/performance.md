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
