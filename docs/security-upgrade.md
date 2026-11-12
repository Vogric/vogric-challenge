# Security upgrade status

Updated: 2026-11-12

## Completed

- Upgraded **Next.js 14.2.35 → 15.5.29** and **React 18 → 19.3.1**.
- Migrated async request APIs (`cookies()`, route `params`) to the Next 15 contract.
- Replaced `next lint` with the ESLint CLI.
- Added `outputFileTracingRoot` to avoid monorepo workspace-root inference.
- Production audit no longer reports critical Next.js advisories.

## Remaining advisories

`npm audit --omit=dev` now reports **3** findings:

| Package | Severity | Scope | Action |
|---|---|---|---|
| `zod` | high | direct | Upgrade to `zod@4.6.7` (breaking) or constrain input sizes |
| `postcss` | high | transitive via Next | Revisit when Next ships an updated bundled PostCSS |
| `next` | moderate | direct | Track Next 15.5.x/16.x patch releases |

Development-only: `vitest@1.6.1` / `tinypool` critical and Vite high. Upgrade
Vitest to 3.2.6+ in a dedicated branch; the UI server is not exposed in CI.

## Follow-up security work

1. Configure Upstash Redis in production (the code path is implemented).
2. JWT `jti` + session revocation/denylist.
3. `npm audit --audit-level=high` in CI once the remaining production
   advisories are resolved.
