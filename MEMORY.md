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
  - `Users.jsx` — tiles, Users / Roles tabs, role help, add-user form, search
  - Roles list + permission matrix (`showRole` / ROLES encoding)
  - Data: `src/data/users.js`
  - CSS: `.perm`, `.role-note`
  - Placeholders removed (all 15 screens live)

## Currently working on

- **Phase:** Phase 7 complete. Ready for Phase 8 (Responsive) when approved.
- **Task:** —
- **File:** —

## Pending

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
9. Users: topbar search filters the users table; permission matrix checkboxes follow ROLES codes from the original; default role shown is Technician.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Dashboard filters | No client filter logic (original had none either) |
| Ticket / device / road list filter bars | Non-search selects are UI-only (original had no filter JS) |
| Permission matrix | Checkboxes are display-bound to role codes; Save shows toast only (same as original) |

## Handoff notes

Walk `/users` — Users tab (search, role help, add user) and Roles tab (Permissions per role, matrix). Next: **Phase 8 — Responsive**. Do not write into `parking_maintenance/`.
