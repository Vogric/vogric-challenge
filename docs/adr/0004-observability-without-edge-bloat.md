# ADR 0004: Observability without inflating the Edge middleware

## Status
Accepted.

## Context
`@vercel/otel` was evaluated for tracing. It increased the Edge middleware
bundle from 38 kB to 97.8 kB, which hurts cold start and the performance budget.

## Decision
- Keep structured JSON logs in `lib/logger.ts`.
- Propagate `x-request-id` from middleware into API errors and Web Vitals.
- Report Web Vitals from the client to a validated `/api/vitals` endpoint.
- Leave Sentry/OTel as an external integration with a DSN/collector.
- Do not bundle tracing libraries into Edge middleware.

## Consequences
- The middleware stays at ~38 kB.
- Errors and Web Vitals are correlatable by request ID.
- Full distributed tracing requires an external provider, which is an explicit
  operational dependency rather than an accidental bundle cost.
