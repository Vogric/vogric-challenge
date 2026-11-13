# ADR 0006: The edge middleware makes no security decisions

## Status

Accepted. Supersedes the middleware part of [ADR 0004](./0004-observability-without-edge-bloat.md).

## Context

`middleware.ts` ran on every matched request, imported `jose`, and verified the
JWT to decide two things:

1. send anonymous `/dashboard` traffic to `/auth/login`;
2. send authenticated `/auth/login` traffic to `/dashboard`.

Both decisions were weaker than they looked:

- The middleware runs on the edge and cannot reach Postgres, so it could only
  check the signature. A **revoked** session (logout on another device, row
  deleted) still passed the gate. Every page and route handler then re-verified
  against the database anyway, which made the edge check pure ceremony.
- Decision 2 was a trap. Expressed as "is there a cookie?" it loops: expired
  cookie at `/auth/login` -> redirect to `/dashboard` -> the page resolves the
  session, finds it dead, redirects back to `/auth/login`. Expressed as a real
  verification, it costs exactly what the middleware exists to avoid.

## Decision

- **No cryptography in the middleware.** It reads the cookie's presence, nothing
  else. It is a UX shortcut, not an authorization boundary; the boundary is the
  session lookup in `lib/auth.ts`, which every page and route handler performs.
- **The "already signed in" redirect moved into the login page**
  (`app/(auth)/auth/login/page.tsx`), where the session is actually resolved.
- **The login rate limit moved into `lib/login-guard.ts`**, invoked from the
  middleware before the request reaches the route. It has to run before the
  handler to be useful against a flood, but it does not need to be inlined in the
  middleware.
- **CSP nonce and request id stay**, because only the middleware can set them
  before the Server Component renders.

## Consequences

- A revoked or forged cookie now costs one server render before the redirect
  instead of being stopped at the edge. The user-visible outcome is identical.
- The redirect loop for expired sessions is gone by construction, not by a
  special case.
- Measured bundle: **40.2 kB → 35.5 kB**. That is the honest number, and it is
  worth stating plainly: the remaining ~35 kB is Next's edge runtime, not
  application code. Removing `jose` was not the 30 kB win it looked like, so the
  value of this change is correctness and a smaller surface, not throughput.
- Every `/dashboard` page already redirected on its own; there is now a test
  (`An authenticated visitor on /auth/login is sent to /dashboard`) that pins the
  behavior that moved.

## Not done, and why

- **Narrowing the matcher to skip `/api/*`**: it would avoid an edge invocation
  per API call, but API routes would lose the `x-request-id` propagation they
  rely on for log correlation. The trade is a few microseconds against
  observability, and it is not worth it at this scale.
- **Node-runtime middleware** (`experimental.nodeMiddleware`): allowed on this
  version but experimental, and it would let the middleware touch the database —
  which is the coupling this ADR removes on purpose.
