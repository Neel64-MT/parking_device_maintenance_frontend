# MEMORY.md — Migration Progress

## Completed

- [x] Planning docs + Phase 0 analysis.
- [x] **Phase 1 — React app foundation**
- [x] **Phase 2 — Shared UI primitives + data modules**
- [x] **Phase 3 — Dashboard**
- [x] **Phase 4 — Tickets**
- [x] **Phase 5 — Devices**
- [x] **Phase 6 — Masters**
- [x] **Phase 7 — Users & roles**
- [x] **Phase 8 — Responsive & interaction polish**
- [x] **Phase 9 — Final QA**
  - Walked all 15 routes + `/dev/ui`; no `.html` links in `src/`
  - `pageId` values match nav `id` / `match` lists
  - Forms call `preventDefault` and toast; sticky-bar actions toast
  - Tabs: tickets New/Assigned/Closed; users Users/Roles; report Day/Week/Month
  - Scan QR: hit (`QR-PD0428` / `PD-0428` / `S2-114`) and miss
  - Restored sidebar subtitle to include `· 1,000 devices` (original parity)
  - ESLint ignores `.vite` + `dist`; `.vite` added to `.gitignore`
  - `npm run lint` and `npm run build` clean
  - README + Architecture folder tree + PR success criteria updated

## Currently working on

- **Phase:** Migration complete (Phases 0–9).
- **Task:** —
- **File:** —

## Pending

- None for design-preview migration. Backend / auth / live QR are out of scope (see PR.md).

## Important decisions

1. Dashboard filters are UI-only (preview); they do not filter the static tables yet — same as original HTML.
2. Ticket list table filters by tab + topbar search (same as original `setTab` / `bindTableSearch`). Filter bar selects do not change the table yet.
3. Ticket detail content is the TK-1042 preview for every `/tickets/:id` route.
4. Panel supports `bodyStyle` for cases like rank-list `padding-top: 6px`.
5. Device list filters (road / status / repeats) are UI-only; search filters the table.
6. Device detail is the PD-0428 preview for every `/devices/:id` route.
7. Issue master: category click re-renders subs; topbar search filters the current category’s sub table.
8. Road list zone/status filters are UI-only; search filters the table.
9. Users: topbar search filters users; permission matrix follows original ROLES codes; default Technician.
10. Responsive: no invented drawer scrim; Escape/resize close are drawer hygiene only.
11. Fleet legend / compact topbar breakpoints (user QA): legend 1-col ≤428px, 2-col 430–1082px; topbar 831–1186px keeps road/date on one row and shows avatar only.

## Known issues / gaps (accepted preview parity)

| Gap | Detail |
|-----|--------|
| Dashboard / list filter selects | UI-only where original had no filter JS |
| Permission matrix Save | Toast only (same as original) |
| Topbar actions on ≤820 | Hidden by design — use in-page / sticky actions |
| Dynamic ticket/device IDs | Always show the sample record (same as single HTML pages) |

## Phase 9 — Final QA checklist

| Check | Status |
|-------|--------|
| `/` → `/dashboard` | OK |
| Dashboard, tickets (list/raise/update/close/detail/report) | OK |
| Devices (list/add/scan/detail) | OK |
| Masters (issues/roads/add) | OK |
| Users (tabs + matrix) | OK |
| Jump links / code links / Assign→detail | OK |
| Toasts on save/export/edit/print/scan empty | OK |
| Lint + build | OK |
| Original path read-only | OK |

## Handoff notes

React design preview is ready for side-by-side review against `parking_maintenance/`. Do not write into the original tree. Next work (if any) is backend wiring — not part of this migration.
