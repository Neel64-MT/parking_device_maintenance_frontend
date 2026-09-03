# MEMORY.md — Migration Progress

## Completed

- [x] Located original project (15 HTML + `asset/style.css`, `nav.js`, `app.js`).
- [x] Planning docs: PR, ARCHITECTURE, RULES, DESIGN, MEMORY, PHASES, SKILLS.
- [x] **Phase 1 — React app foundation** (shell, router, toast, placeholders).
- [x] **Phase 2 — Shared UI primitives + data modules**
  - `src/data/issueMaster.js` (ISSUE_MASTER identical to `app.js` + helpers)
  - `src/data/partMaster.js`, `src/data/team.js`
  - `src/hooks/useTableSearch.js`
  - `src/components/ui/*`: Button, Panel, Pill/SeverityPill, JumpLinks, FilterBar/Field, Tabs, Views, EmptyState, DeviceCard, PhotoPicker, IssueSelects, PartChips, TeamSelect, Tile
  - Shared CSS ported into `src/index.css` (forms, panels, tables, pills, filterbar, jump, tiles, tabs, views, chips, photos, device card, …)
  - Scratch demo at `/dev/ui` (not in menu)
  - Lint + build pass

## Currently working on

- **Phase:** Phase 2 complete. Ready for Phase 3 (Dashboard) when approved.
- **Task:** —
- **File:** —

## Pending

- [ ] Phase 3: Dashboard
- [ ] Phase 4: Tickets (list → raise → detail → update → close → report)
- [ ] Phase 5: Devices (list → detail → add → scan)
- [ ] Phase 6: Masters (issue, roads)
- [ ] Phase 7: Users & roles
- [ ] Phase 8: Responsive + parity QA
- [ ] Phase 9: Final QA / MEMORY update

## Important decisions

1. Original project remains read-only.
2. Design-preview parity first; no backend.
3. Layout chrome keeps original class names; nav submenu uses `.nav-sub`.
4. `.inline-form.open` added for React (original used `style.display`).
5. `/dev/ui` is a Phase 2 scratch route only — not a product menu item.
6. PartChips / TeamSelect included as shared helpers used on multiple ticket flows.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| No API | Static data modules |
| Full page UIs | Still placeholders except `/dev/ui` kit |
| Fleet / timeline / scanbox CSS | Ported later with those pages (Phase 3+) |

## Handoff notes

Verify primitives at `http://localhost:5173/dev/ui`. Next: **Phase 3 — Dashboard** from `dashboard.html`. Do not write into `parking_maintenance/`.
