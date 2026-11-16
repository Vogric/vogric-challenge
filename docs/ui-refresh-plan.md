# UI refresh plan — Editorial Ops

> Status (2026-11-16): Phases 1–5 shipped. Phase 6 shipped screenshot capture,
> the authenticated performance budget, and login visual snapshots; remaining
> work is external observability and broader visual coverage.

## Objective

Make the demo look like a product built by an infrastructure company, not a
shadcn starter. The interface must communicate the same rigor as the ADRs:
density, hierarchy, restraint and operational confidence.

## Non-goals

- No new product features.
- No new backend architecture.
- No gradients, glassmorphism or decorative charts.
- No page-level fade transitions; keep the current instant navigation.
- No component library migration. Keep Tailwind + the existing shadcn primitives.

## Design direction: Editorial Ops

A warm paper canvas, an ink sidebar, white surfaces and one signal color. The
feel is closer to Linear/Vercel/Stripe than to a generic admin template.

### Tokens

| Token | Light | Dark |
|---|---|---|
| `background` | `#F6F5F2` | `#0B0C0E` |
| `card` | `#FFFFFF` | `#141619` |
| `foreground` | `#141414` | `#F5F5F4` |
| `muted-foreground` | `#6B6B66` | `#A1A1AA` |
| `border` | `#E5E3DC` | `#262A2F` |
| `primary` | `#2F5BFF` | `#6B8CFF` |
| `primary-soft` | `#EEF2FF` | `#17213F` |
| `success` | `#0F8A5F` | `#34D399` |
| `warning` | `#B7791F` | `#FBBF24` |
| `danger` | `#B42318` | `#F87171` |
| `sidebar` | `#111214` | `#08090A` |

- Radius: `12px` cards, `10px` controls, `999px` pills.
- Shadow: `0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)`.
- Spacing: 4/8/12/16/24/32/48.
- Icons: Lucide, 16/18/20px, stroke 1.75.

### Typography

- **Geist Sans** for UI, **Geist Mono** for IDs, cursors and metrics.
- Scale: 12 label, 13 meta, 14 body, 16 card title, 20 section, 32–36 KPI.
- Labels: 11–12px, uppercase, `tracking-[0.08em]`.
- KPI numbers: 32–36px, `tabular-nums`, weight 600.
- Never use the same hierarchy for title and description.

## Target layout

### Dashboard

```text
┌ sidebar ─┐ ┌ navbar: breadcrumb · search ⌘K · actions · user ─┐
│ brand    │ ├──────────────────────────────────────────────────┤
│ org      │ │ Overview        Acme Corp · ADMIN   [range] [+ New]│
│ nav      │ │ ┌ KPI ─┐ ┌ KPI ─┐ ┌ KPI ─┐ ┌ KPI ─┐             │
│          │ │ │ 5    │ │1,345 │ │ 1    │ │ 675  │             │
│          │ │ └──────┘ └──────┘ └──────┘ └──────┘             │
│          │ │ ┌ Task distribution ─┐ ┌ Recent activity ─────┐ │
│          │ │ │ donut / bars      │ │ audit feed           │ │
│          │ │ └───────────────────┘ └──────────────────────┘ │
│ user     │ └──────────────────────────────────────────────────┘
└──────────┘
```

### Sidebar

- Ink background, 240–256px.
- Brand: product name, not “SaaS”.
- Organization switcher: custom popover with workspace avatar, name and role pill.
- Nav: icon + label + optional count; active state = soft tint + 2px left bar, not a full blue block.
- Footer: user avatar, email, sign out.

### Navbar

- Height 56–64px.
- Left: breadcrumb.
- Center/left: command palette trigger `Search or jump to… ⌘K`.
- Right: New task, notifications, theme, user menu.
- No empty space.

## Screen-by-screen

### Login

- Split layout: form left, product proof right (or subtle grid).
- Brand and one-line value proposition.
- Inputs at 44px height; submit full width; pending spinner.
- Keep current accessibility and error behavior.
- Add “Demo credentials” as a quiet hint, not a marketing block.

### Dashboard

- Header with title, workspace + role, date-range and primary action.
- Four KPI cards: icon, label, big number, trend (e.g. `+12% vs last week`), sparkline.
- Lower grid:
  - Task distribution by status.
  - Recent audit activity (5 items).
  - Team members (avatars + roles).
- Empty/loading states match final height.

### Projects / Tasks

- One H1, one breadcrumb. Remove the duplicate “Projects / Tasks”.
- Toolbar: search, status filter, project filter, “New task”.
- Table columns: Task, Project, Status, Assignee, Updated.
- Remove CUID from the primary table. Show it only in a row detail or tooltip.
- Status: colored pill + menu, not a native `<select>`.
- Dates: relative (`2h ago`) with absolute tooltip.
- Pagination footer: `1–50 of 2,020`; cursor Next/Previous.
- Empty state with icon and CTA.

### Members

- Table with avatar, name/email, role pill, joined date.
- Role changes via menu, last-admin guard message.
- Admin-only actions visually separated.
- Invite button disabled with “Coming next” or omitted; do not fake it.

### Audit

- Timeline or dense table with actor avatar, action, entity and relative time.
- Filter by action/actor.
- Metadata expandable, not truncated raw JSON.

### Settings

- Two-column cards: Account, Organization, Security.
- Read-only fields clearly marked; no fake save buttons.
- Add “Session: 7 days · revocable” with sign-out action.

### Mobile

- Bottom tab bar: Dashboard, Tasks, Team, More.
- Organization switcher in a sheet/popover.
- Tables become cards or horizontally scroll with sticky first column.
- No horizontal nav squeeze.

## Component inventory

| Component | Action | File |
|---|---|---|
| `Button` | Add `ink`, `soft`, `ghost` variants; 40/44px heights | `components/ui/button.tsx` |
| `Card` | 12px radius, 1px border, subtle shadow, header spacing | `components/ui/card.tsx` |
| `Badge` | New: neutral, success, warning, danger, outline | `components/ui/badge.tsx` |
| `Input` | 44px height, 12px radius, clear focus | `components/ui/input.tsx` |
| `Select` | Replace native selects in org/status with popover/menu | new `components/ui/select-menu.tsx` |
| `Avatar` | Initials + optional image | new `components/ui/avatar.tsx` |
| `KpiCard` | Number-first, trend, sparkline | `components/dashboard/stat-card.tsx` |
| `Sidebar` | Ink shell, org popover, active indicator, user footer | `components/sidebar.tsx` |
| `Navbar` | Breadcrumb, command trigger, actions | `components/navbar.tsx` |
| `TaskTable` | New columns, status pill, relative dates, toolbar | `components/projects/TaskTable.tsx` |
| `MembersTable` | Avatars, role pill, menu | `components/organizations/members-table.tsx` |

Avoid adding a full component library. Add only the primitives the screens need.

## Demo data

The first page must look real. Replace “Bulk Task 1954 — API Gateway” with curated
tasks created after the bulk seed so they sort first by `updatedAt`:

- “Migrate billing webhooks”
- “Review Q4 onboarding flow”
- “Fix SSO callback timeout”
- “Rotate production API keys”
- “Investigate duplicate audit events”

Add assignees with names, realistic projects and recent timestamps. Keep the
2,000 bulk tasks for pagination/performance, not for the first impression.

## Phases

### Phase 1 — Foundation (1 day)

- Tokens, Geist fonts, base typography, radius/shadows.
- Button/Card/Input/Badge primitives.
- Sidebar shell + brand + active nav.
- Navbar shell + breadcrumb + user menu.
- Acceptance: no visual regressions; axe still 0 serious; build passes.

### Phase 2 — Dashboard (1 day)

- KPI cards number-first with trend.
- Lower grid: distribution, audit activity, team.
- Header actions and date range.
- Acceptance: no empty half-screen; skeleton matches final height.

### Phase 3 — Tasks (1 day)

- Toolbar, status pills, remove CUID, relative dates, pagination footer.
- Filter/search behavior (client-side or query param).
- Acceptance: 2,020 tasks paginate; cross-tenant 403 still tested.

### Phase 4 — Members, Audit, Settings (1 day)

- Avatar/role pills, audit timeline, settings cards.
- Admin-only actions and empty states.
- Acceptance: admin/viewer distinction visible; axe passes.

### Phase 5 — Mobile + command palette (1 day)

- Bottom tab bar, org sheet, responsive tables.
- `⌘K` palette for navigation and org switch.
- Acceptance: 390px no horizontal overflow; keyboard navigation works.

### Phase 6 — Polish + QA (1 day)

- Visual snapshots for login; dashboard/team/audit coverage remains.
- Authenticated LCP/CLS/TTFB and JS-transfer budget shipped (`npm run perf:budget`).
- Final screenshots for README/video; update demo recording.

## Quality gates

- `npm run typecheck`, `lint`, `build` pass.
- `npm run test:coverage` stays above 92% on `lib/` and critical hooks.
- `npm run test:e2e` passes; axe 0 critical/serious on all screens.
- Lighthouse: LCP < 2.5s, CLS < 0.1, INP < 200ms on dashboard.
- No horizontal scroll at 390px.
- Login visual snapshots reviewed in PR; other screens are captured but not diffed.

## Risks and trade-offs

| Risk | Mitigation |
|---|---|
| Redesign breaks E2E selectors | Add `data-testid` only where semantics are unstable; prefer roles/labels |
| Fonts add weight | Subset Geist; preload only Sans |
| Command palette adds JS | Custom lightweight palette avoids a new dependency |
| New colors break dark mode | Define both tokens before component work |
| More UI work hides backend strengths | Keep the technical proof in README, not in the dashboard |

## Definition of done

A recruiter sees a product, not a template. A Staff engineer sees hierarchy and
restraint. An FDE sees a demo they can hand to a customer without apologizing
for the UI. The existing security, tenancy, performance and testing claims remain
true and visible.
