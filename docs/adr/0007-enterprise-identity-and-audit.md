# ADR 0007: Enterprise identity and audit path

## Status
Accepted for the current scope; SSO and invitations are future work.

## Context
The demo uses a custom JWT with revocable database sessions. That is a good
trade-off for a first-party dashboard, but enterprise customers usually require
SSO/SAML, invitations, and an audit trail.

## Decision
- Keep the custom JWT/session implementation for the current product.
- For enterprise SSO, integrate a managed identity provider (WorkOS or Auth.js
  with an OIDC/SAML provider) instead of implementing SAML in-house.
- Keep `Session` as the local source of truth even when SSO is added, so
  revocation and role changes remain under application control.
- Record tenant-scoped audit events for task status changes and membership role
  changes (`AuditEvent`).
- Require ADMIN to view `/dashboard/audit`.
- Invitations will use a single-use, expiring token and an explicit role; they
  are not implemented yet.

## Consequences
- The current auth flow remains small and edge-friendly.
- Enterprise identity becomes a managed integration, not a custom protocol
  implementation.
- Audit events are queryable per organization and include actor, action, entity
  and metadata.
- Invitations and SSO are explicitly pending rather than silently missing.
