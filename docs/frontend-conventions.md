# Frontend engineering conventions

This document is the review checklist for React/Next changes. The CI gates are
the enforcement; this file explains the intent.

## File and route boundaries

- `page.tsx` composes auth, data loading, and layout only. Hard limit: **100 lines**.
- Any other source file has a **150-line** limit. Split by responsibility, not by
  arbitrary line count.
- Reusable helpers live in one-function modules (`lib/format-relative-time.ts`,
  `lib/initials.ts`, `lib/tasks/task-cursor.ts`). React contexts may colocate
  their provider and hook because that pair is the public API.
- Route-private server components live under `_components/`; they are not
  imported by other routes.
- No barrel files for application code. Import the module that owns the behavior.

## TypeScript

- `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and
  `exactOptionalPropertyTypes` are enabled.
- Import React types directly (`ReactNode`, `FormEvent`, `RefObject`); do not
  use the `React.*` namespace for types.
- Every `useState` has an explicit generic.
- `unknown` is allowed only at an external boundary (JSON, `catch`, third-party
  input). Parse it immediately with Zod and expose a narrow type.
- API responses and audit metadata are parsed, not cast.

## Server/client split

- Server Components by default. Add `'use client'` only for state, effects,
  browser APIs, or event handlers.
- The server owns session and membership resolution. The client never receives a
  trusted organization id.
- Hydrate user data from the server; do not add a client `/me` waterfall.
- Use `Promise.all` for independent server reads and Suspense for streaming.

## Data and state

- TanStack Query owns client cache; keys are centralized in `lib/query-keys.ts`.
- Cursor pagination is the only UI pagination path. Filter signatures reset the
  cursor without issuing a stale cursor request.
- Optimistic mutations must restore the previous cache on error and surface a
  notification.
- Client caches with unbounded key spaces need a maximum-entry policy (for
  example, the task count cache).

## Comments

- Explain the non-obvious **why**, constraint, or trade-off. Do not restate the
  code or narrate obvious operations.
- Prefer a named constant over a comment that explains a magic number.
- Delete comments when the behavior or legacy condition no longer exists.
- Keep security/transaction/concurrency rationale; those are the comments a
  reviewer cannot reconstruct quickly.

## Accessibility and UX

- Every page has one `h1`, a skip link, and visible focus styles.
- Native controls first; icon-only buttons require an accessible name.
- Test the command palette with keyboard only and keep focus inside the dialog.
- Every route gets axe coverage; mobile must have no horizontal overflow.

## Verification

Before merging:

```bash
npm run verify
```

`verify` runs typecheck, typed lint, file-size gates, test exclusivity, unit
tests, coverage, and E2E (including visual and cross-browser projects). Build,
performance, and Lighthouse run in CI after the build.
