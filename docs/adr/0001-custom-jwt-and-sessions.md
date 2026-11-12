# ADR 0001: Custom JWT with revocable database sessions

## Status
Accepted.

## Context
The app needs authentication without a third-party auth service. A stateless JWT
alone cannot support logout-everywhere or compromised-session revocation.

## Decision
- Sign JWTs with `jose` using HS256, issuer `saas-dashboard`, audience
  `saas-dashboard-web`, and a 7-day expiry.
- Include a `jti` in every token.
- Persist a `Session` row keyed by `jti` with an expiry.
- Validate the session row in Node request paths (`getCurrentUserFromRequest`,
  `getCurrentUserFromServer`).
- Delete the session row on logout.

## Consequences
- Revocation works without a refresh-token service.
- Middleware only verifies the signature; the server-side session check is the
  authoritative gate.
- Sessions issued before the `jti` change are invalid and require re-login.
- A future refresh-token flow should keep the same session table as the source
  of truth.
