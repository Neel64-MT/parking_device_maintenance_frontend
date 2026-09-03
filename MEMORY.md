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
- [x] **Phase 5 — Devices**
  - `DeviceList` — tiles (linked), filter bar, search, table
  - `DeviceDetail` — PD-0428 history (split table, parts, fail ranks)
  - `DeviceAdd` — identity / location / installation + save toasts
  - `ScanQr` — simulate/manual find; hit on QR-PD0428 / PD-0428 / S2-114
  - Data: `devices.js`, `deviceDetail.js`
  - CSS: `.scanbox`, `table.split`
  - Device placeholders removed from `placeholders.jsx`

## Currently working on

- **Phase:** Phase 5 complete. Ready for Phase 6 (Masters) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 6: Masters (issue, roads)
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

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard filters | No client filter logic (original had none either) |
| Ticket list filter bar | Road / status / category / assignee are UI-only (original had no filter JS) |
| Device list filter bar | Road / status / repeats are UI-only (original had no filter JS) |
| Master / user pages | Still placeholders |

## Handoff notes

Walk `/devices` → history → add → scan (hit/miss) against the original HTML. Next: **Phase 6 — Masters**. Do not write into `parking_maintenance/`.
