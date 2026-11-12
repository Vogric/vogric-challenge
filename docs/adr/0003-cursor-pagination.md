# ADR 0003: Cursor pagination for task lists

## Status
Accepted.

## Context
Offset pagination becomes slower as `OFFSET` grows and can skip/duplicate rows
when tasks are updated concurrently.

## Decision
- Use an opaque base64url cursor containing `updatedAt` and `id`.
- Order by `updatedAt DESC, id DESC`.
- Fetch `pageSize + 1` rows to determine `hasNextPage`.
- Keep the legacy offset mode for API compatibility.
- Cache `totalCount` per organization for 30 seconds in-process.
- Add `Task(projectId, updatedAt)` and `Task(status)` indexes.

## Consequences
- Page navigation is stable and avoids deep offsets.
- The UI tracks cursor history to support Previous.
- Status updates do not invalidate the count cache because they do not change
  row count. Future create/delete endpoints must clear it.
- A distributed count cache is still a future improvement.
