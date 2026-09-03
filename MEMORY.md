# MEMORY.md — Migration Progress

## Completed

- [x] Planning docs + Phase 0 analysis.
- [x] **Phase 1 — React app foundation** (shell, router, toast, placeholders).
- [x] **Phase 2 — Shared UI primitives + data modules** (`/dev/ui` scratch).
- [x] **Phase 3 — Dashboard**
- [x] **Phase 4 — Tickets**
- [x] **Phase 5 — Devices**
- [x] **Phase 6 — Masters**
  - `IssueMaster` — category pick list, sub table, USAGE counts, search, inline add forms
  - `RoadList` — filters, search, table
  - `RoadAdd` — multi-panel form + save toasts
  - Data: `ISSUE_USAGE` in `issueMaster.js`, `roads.js`
  - CSS: `.grid-master`, `.pick` / `.pick-list`
  - Master placeholders removed (Users remains)

## Currently working on

- **Phase:** Phase 6 complete. Ready for Phase 7 (Users & roles) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 7: Users & roles
- [ ] Phase 8: Responsive + parity QA
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

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard filters | No client filter logic (original had none either) |
| Ticket / device / road list filter bars | Non-search selects are UI-only (original had no filter JS) |
| Users page | Still a placeholder |

## Handoff notes

Walk `/masters/issues` (category switch, search, deactivate toasts) and `/masters/roads` → add against the original HTML. Next: **Phase 7 — Users**. Do not write into `parking_maintenance/`.
