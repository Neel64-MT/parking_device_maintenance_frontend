# MEMORY.md — Migration Progress

## Completed

- [x] Planning docs + Phase 0 analysis.
- [x] **Phase 1 — React app foundation** (shell, router, toast, placeholders).
- [x] **Phase 2 — Shared UI primitives + data modules** (`/dev/ui` scratch).
- [x] **Phase 3 — Dashboard**
- [x] **Phase 4 — Tickets**
- [x] **Phase 5 — Devices**
- [x] **Phase 6 — Masters**
- [x] **Phase 7 — Users & roles**
- [x] **Phase 8 — Responsive & interaction polish**
  - Audited breakpoints vs original / DESIGN.md: 820, 760, 900, 940, 1080 all present
  - `class-pair` stack restored to ≤760 (was incorrectly under 820)
  - Sticky bars offset by `--rail` ≥821; mobile ticket flows keep `.mobile` + sticky-bar
  - Topbar actions hidden ≤820; menu button + off-canvas rail
  - `:focus-visible` + `prefers-reduced-motion` already in place
  - Rail closes on resize to desktop, Escape, and navigate; menu `aria-expanded`
  - Breakpoint map commented on the §§14 block in `index.css`

## Currently working on

- **Phase:** Phase 8 complete. Ready for Phase 9 (Final QA) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 9: Final QA / MEMORY update

## Important decisions

1. Dashboard filters are UI-only (preview); they do not filter the static tables yet — same as original HTML.
2. Ticket list table filters by tab + topbar search (same as original `setTab` / `bindTableSearch`). Filter bar Reset clears the selects and search; those selects do not change the table yet.
3. Ticket detail content is the TK-1042 preview for every `/tickets/:id` route (same sample record as original).
4. Panel supports `bodyStyle` for cases like rank-list `padding-top: 6px`.
5. Device list filters (road / status / repeats) are UI-only; search filters the table (same as original `bindTableSearch`).
6. Device detail is the PD-0428 preview for every `/devices/:id` route (same as original single sample page).
7. Issue master: category click re-renders subs; topbar search filters the current category’s sub table; deactivate/delete toasts match USAGE.
8. Road list zone/status filters are UI-only; search filters the table (same as original).
9. Users: topbar search filters the users table; permission matrix checkboxes follow ROLES codes from the original; default role shown is Technician.
10. Responsive: no invented mobile chrome (no drawer scrim); Escape/resize close are drawer hygiene only.
11. QA breakpoints (user-specified): fleet legend is 1 column ≤428px, 2-column grid 430–1082px, original row with pushed “open > 3 days” above 1082px. Topbar 831–1186px keeps road/date controls on one row and shows the user avatar only.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard / list filter selects | UI-only where original had no filter JS |
| Permission matrix Save | Toast only (same as original) |
| Topbar actions on ≤820 | Hidden by design — use in-page / sticky actions on field flows |

## Phase 8 resize checklist (DESIGN.md)

| Width | Expected | Status |
|-------|----------|--------|
| ≤820 | Rail off-canvas, menu btn, hide topbar-actions, page pad, facts 2-col, fleet 28px | OK |
| ≥821 | Sticky bar `left: var(--rail)` | OK |
| ≤760 | Form grid + class-pair stack | OK |
| ≤900 | Tiles → 2 columns | OK |
| ≤940 | Master grid stacks | OK |
| ≤1080 | `.grid-2` / `.grid-2-even` stack | OK |
| Field pages | `.mobile` inputs 46px / sticky bar | OK |
| Focus / motion | `:focus-visible` teal; reduced-motion kills transitions | OK |

## Handoff notes

Resize the shell at the widths above; walk raise/update/close on a narrow viewport. Next: **Phase 9 — Final QA**. Do not write into `parking_maintenance/`.
