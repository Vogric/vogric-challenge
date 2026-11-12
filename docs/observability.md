# Observability baseline

## SLOs to track

| Signal | Target | Source |
|---|---|---|
| API tasks p95 latency | < 300 ms | Vercel function logs |
| API error rate | < 0.5% | structured error logs |
| Dashboard LCP (p75) | < 2.5 s | Vercel Speed Insights |
| CLS (p75) | < 0.1 | Vercel Speed Insights |
| Availability | 99.9% | `/api/health` probes |

## Current signals

- `/api/health` is dynamic and returns database connectivity with `no-store`.
- API failures emit structured JSON through `lib/logger.ts` with event names such as
  `auth.login.failed`, `tasks.list.failed` and `tasks.update.failed`.
- `components/web-vitals.tsx` reports LCP/CLS/INP/TTFB to `/api/vitals` in
  production; the API validates the payload and emits `web_vitals.metric` logs.
- Middleware propagates `x-request-id`; API error and Web Vitals logs include it.
- Vercel captures function logs and request metadata.

## Next steps

1. Add Sentry (`@sentry/nextjs`) or an external OpenTelemetry collector with a DSN.
   `@vercel/otel` was evaluated but excluded because it inflated the Edge
   middleware bundle from 38 kB to 97 kB.
2. Add Vercel Speed Insights when the account-level integration is available.
3. Create alerts for error-rate and p95 regressions.
4. Add Lighthouse CI budgets to the pull-request workflow.
