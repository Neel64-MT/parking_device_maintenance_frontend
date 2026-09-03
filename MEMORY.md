# MEMORY.md — Migration Progress

## Completed

- [x] Planning docs + Phase 0 analysis.
- [x] **Phase 1 — React app foundation** (shell, router, toast, placeholders).
- [x] **Phase 2 — Shared UI primitives + data modules** (`/dev/ui` scratch).
- [x] **Phase 3 — Dashboard**
  - `src/pages/Dashboard.jsx` — fleet strip, why-down ranks, road-wise table, open tickets
  - `src/data/dashboard.js` — static preview data from `dashboard.html`
  - Fleet / rank-row CSS in `src/index.css`
  - Topbar road + date filters via `PageMeta` actions
  - Links to `/tickets`, `/devices/:id`, `/tickets/:id`, `/masters/roads`, raise flow
  - Lint + build pass
- [x] **Phase 4 — Tickets**
  - List (tabs, tiles, filters, search), raise, detail, update, close, work report
  - Data: `slots.js`, `tickets.js`, `ticketDetail.js`, `workReport.js`
  - Routes wired to real pages; ticket placeholders removed

## Currently working on

- **Phase:** Phase 4 complete. Ready for Phase 5 (Devices) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 5: Devices (list → detail → add → scan)
- [ ] Phase 6: Masters (issue, roads)
- [ ] Phase 7: Users & roles
- [ ] Phase 8: Responsive + parity QA
- [ ] Phase 9: Final QA / MEMORY update

## Important decisions

1. Dashboard filters are UI-only (preview); they do not filter the static tables yet — same as original HTML.
2. Ticket list table filters by tab + topbar search (same as original `setTab` / `bindTableSearch`). Filter bar Reset clears the selects and search; those selects do not change the table yet.
3. Ticket detail content is the TK-1042 preview for every `/tickets/:id` route (same sample record as original).
4. Panel supports `bodyStyle` for cases like rank-list `padding-top: 6px`.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard filters | No client filter logic (original had none either) |
| Ticket list filter bar | Road / status / category / assignee are UI-only (original had no filter JS) |
| Device / master / user pages | Still placeholders |

## Handoff notes

Walk `/tickets` → raise → update → close and `/tickets/report` against the original HTML. Next: **Phase 5 — Devices**. Do not write into `parking_maintenance/`.
