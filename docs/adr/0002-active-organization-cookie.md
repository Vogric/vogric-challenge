# ADR 0002: Active organization resolved server-side from a validated cookie

## Status
Accepted.

## Context
The dashboard is multi-tenant. The active organization must not be trusted from
a query parameter or client-only state.

## Decision
- Store the selected organization in an HttpOnly `active_org` cookie.
- On every server render, resolve it against the user's `Membership` rows.
- Fall back to the oldest membership if the cookie is missing or stale.
- After a switch, clear task queries and refresh server components.
- Reset the projects client component on organization change with a React key.

## Consequences
- A forged cookie cannot access another tenant: membership validation is always
  performed server-side.
- The DB is the source of truth; the cookie is only a preference.
- Organization switching is deterministic and cache-safe.
