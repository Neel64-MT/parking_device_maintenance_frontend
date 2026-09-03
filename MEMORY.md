# MEMORY.md — Migration Progress

## Completed

- [x] Located original project (15 HTML + `asset/style.css`, `nav.js`, `app.js`). Confirmed **no image/font/video asset files** beyond Google Fonts + inline SVG.
- [x] Read product skill (Claude share blocked by Cloudflare; skill used as scope proxy).
- [x] Compared original vs product scope; documented gaps in PR.md / this file.
- [x] Inspected destination Vite + React 19 scaffold.
- [x] Wrote planning docs: PR, ARCHITECTURE, RULES, DESIGN, MEMORY, PHASES, SKILLS.
- [x] **Phase 1 — React app foundation**
  - Tailwind v4 (`@tailwindcss/vite`) + `react-router-dom`
  - Design tokens + ported rail/shell/topbar/toast CSS in `src/index.css`
  - `src/config/nav.js` (APP, MENU with React paths, match lists)
  - `Sidebar`, `Topbar`, `AppLayout`, `PageMeta`, `ToastProvider` / `toast()`
  - All 15 placeholder routes; `/` → `/dashboard`
  - Vite starter UI removed; Archivo via `index.html`
  - `npm run lint` and `npm run build` pass

## Currently working on

- **Phase:** Phase 1 complete. Ready for Phase 2 when approved.
- **Task:** None in progress.
- **File:** —

## Pending

- [ ] Phase 2: Shared UI primitives + data modules (`ISSUE_MASTER`, Button, Panel, Pill, PhotoPicker, …)
- [ ] Phase 3: Dashboard
- [ ] Phase 4: Tickets (list → raise → detail → update → close → report)
- [ ] Phase 5: Devices (list → detail → add → scan)
- [ ] Phase 6: Masters (issue, roads)
- [ ] Phase 7: Users & roles
- [ ] Phase 8: Responsive + parity QA
- [ ] Phase 9: Final QA / MEMORY update

## Important decisions

1. **Original is read-only** — all work in this frontend repo.
2. **Migration = design-preview parity first** — keep mock data and toast-on-submit; do not invent a backend in this plan.
3. **No login page** in original → do not add one unless requested.
4. **Stack:** Vite + React + Tailwind v4 + `react-router-dom`.
5. **Styling:** Theme tokens in `:root` / `@theme`; layout chrome keeps original class names (`.rail`, `.shell`, …). Nav submenu uses `.nav-sub` (not `.sub`) to avoid clashing with record `.sub` later.
6. **Page chrome:** `PageMeta` + context replaces `data-page` / `data-title` / `#topbar-actions`.
7. **Toast:** Module-level `toast()` bridge + provider (2.6s), matching `app.js`.
8. **Users tab order:** Preserve original (Users, then Roles).
9. **Mobile rail:** Closes when a nav link is clicked (`onNavigate`); no pathname effect (lint).

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| No API | All data static |
| No real QR camera | Simulate scan only |
| Auth | Mock user only |
| Phase 1 pages | Placeholders only — full UI in later phases |
| device-add Status select | Keep as in original when built |
| Skill OEM vs Site attendant | Keep original six roles |

## Handoff notes

Phase 1 shell is ready. Next: **Phase 2** — shared UI primitives and `src/data/*` from `app.js`. Do not write into `parking_maintenance/`.
