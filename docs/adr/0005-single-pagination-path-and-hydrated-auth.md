# ADR 0005: One pagination path, and auth hydrated from the server

## Status

Accepted. Supersedes the dual-mode part of [ADR 0003](./0003-cursor-pagination.md).

## Context

ADR 0003 introduced cursor pagination but kept the offset implementation "for
API compatibility". Two months later the cost was visible in three places:

1. `GET /api/dashboard/tasks` branched on which parameters arrived, so
   `pagination.page` meant "the page you asked for" in one branch and "the page
   we echoed back" in the other.
2. The client never sent `page`, yet `page` was part of its TanStack Query key.
   Navigating back created a new key, so `keepPreviousData` never helped and an
   already-cached page was refetched.
3. The offset tests and the cursor tests asserted different response shapes for
   the same endpoint.

In parallel, the dashboard had an authentication waterfall: the layout resolved
the session on the server, then `AuthContext` fetched `/api/auth/me` again on
mount with `staleTime: 0` and `refetchOnMount: 'always'`. Every dashboard load
paid for a request the server had already answered, and the navbar rendered
"Guest" until it returned.

## Decision

- **Delete the offset path.** `getTasksPage(organizationId, cursor, pageSize)` is
  the only entry point. The response no longer contains `page`; it contains
  `pageSize`, `totalCount`, `totalPages`, `nextCursor` and `hasNextPage`.
- **Cache key follows the wire format.** `taskKeys.cursor(orgId, cursor)` — no
  `page`, because the server never receives one.
- **Auth is hydrated, not fetched.** The dashboard layout resolves the user and
  passes it to `AuthProvider` as `initialData` with a five-minute `staleTime`.
  The provider is mounted in the dashboard layout, not globally, because the
  login page has no user to hydrate.
- **The response contract is parsed, not cast.** `tasksResponseSchema` (Zod) is
  the single source of truth for the task payload; the client parses every
  response and surfaces a contract violation as an error instead of rendering an
  empty table.

## Consequences

- One pagination algorithm and one response shape to test and to reason about.
- Going back a page is now a cache hit instead of a refetch.
- The login bundle drops from 17.5 kB to 4.5 kB because the auth provider is no
  longer part of that route's tree.
- `initialData` means a stale user is possible for up to five minutes. Acceptable
  for display data; every API route still revalidates the session against the
  database on each request, so authorization is never based on the cached value.
- The offset implementation is gone from the history's working tree. If a future
  client genuinely needs page numbers, it can be reintroduced as a projection on
  top of `totalCount` — but it should be a new ADR, not a silent branch inside
  the existing handler.

## Not done here

- **Per-organization cache tags.** KPI counts are cached with `unstable_cache`
  and invalidated by `revalidateTag(ORG_STATS_TAG)` on every task mutation, with a
  5-minute TTL as a backstop. The tag is coarse (it drops counts for all
  organizations) because `unstable_cache` only accepts a static tag list.

  `use cache` + `cacheTag(\`org-${organizationId}\`)` would make it precise, but
  `experimental.cacheComponents` is gated: on Next 15.5.29 the build fails with
  *"can only be enabled when using the latest canary version of Next.js"*. This
  was verified, not assumed. When the project moves to a canary, the change is
  mechanical: swap the wrapper for `'use cache'`, call `cacheTag` with the
  organization id, and turn `ORG_STATS_TAG` into a function.
- **Coverage of route handlers.** The RBAC decisions live in `app/api/**` and are
  covered by E2E, not by the unit gate.
