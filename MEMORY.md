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

## Currently working on

- **Phase:** Phase 3 complete. Ready for Phase 4 (Tickets) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 4: Tickets (list → raise → detail → update → close → report)
- [ ] Phase 5: Devices (list → detail → add → scan)
- [ ] Phase 6: Masters (issue, roads)
- [ ] Phase 7: Users & roles
- [ ] Phase 8: Responsive + parity QA
- [ ] Phase 9: Final QA / MEMORY update

## Important decisions

1. Dashboard filters are UI-only (preview); they do not filter the static tables yet — same as original HTML.
2. Ticket/device codes link to React routes that are still placeholders until Phase 4/5.
3. Panel supports `bodyStyle` for cases like rank-list `padding-top: 6px`.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard filters | No client filter logic (original had none either) |
| Ticket/device pages | Still placeholders |

## Handoff notes

Open `/dashboard` and compare to original `dashboard.html`. Next: **Phase 4 — Tickets**. Do not write into `parking_maintenance/`.
