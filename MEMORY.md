# MEMORY.md — Migration Progress

## Completed

- [x] Phases 0–9 — HTML → React design-preview migration.
- [x] **Phase 10 — Auth** (login / JWT / RequireAuth).
- [x] **Phase 11 — Signup approval, forgot/reset UI, admin password**
- [x] **Phase 12 — Sidebar Settings + desktop collapse**
  - `SETTINGS` bottom utility + `/settings` route
  - Desktop `railCollapsed` + `html.rail-narrow` (`--rail-expanded: 248px`, `--rail-collapsed: 64px`)
  - Smooth width/label transitions; native `title` tooltips when collapsed
  - Mobile `railOpen` drawer unchanged (full labels; collapse toggle hidden ≤820)
  - Branding: teal `P` + `APP` (glyph-only when collapsed)
  - Collapsed Tickets/Masters: click expands rail then opens group
- [x] **Landing filters/CTAs out of topbar**
  - Dashboard road/dates under JumpLinks (`.page-toolbar`)
  - TicketList search + Raise in table panel-head
  - WorkReport Views + Export under JumpLinks
  - DeviceList Scan/Add via JumpLinks `actions`
  - IssueMaster search before Add sub-category
  - RoadList Add road after View devices
  - Users search/status/Add user as collapsible filter after tiles
- [x] **Phase 13 — Settings account + shell / dashboard UX**
  - Settings: Profile (name / email / mobile) via `PATCH /api/auth/me`
  - Settings: Password (current + new) via `POST /api/auth/change-password` (reissues JWT)
  - Settings panels size to content; save buttons pinned to form foot (`.settings-actions`)
  - Topbar logout icon + confirmation Modal (Cancel → Log out, right-aligned)
  - Shell fills viewport beside rail; `.page` max-width `1360px` removed
  - Dashboard open-tickets panel removed (`OPEN_TICKETS` data dropped)
  - Fleet legend: tip copy in `Tooltip`; four columns aligned (no `legend-push`)
  - Panel `.foot-note` bottom-aligned in equal-height `.grid-2` cards

## Currently working on

- **Phase:** Phase 13 complete — docs audited.
- **Task:** —
- **File:** —

## Pending

- Wire remaining domain screens to backend APIs
- UI menu filtering by role permissions
- Live camera QR
- Roles tab on Users still mostly preview matrix (list API available)

## Important decisions

1–11. Prior phases (filters UI-only, static detail samples, responsive, Phase 10 JWT).
12. Reuse `users.status` with `Pending` (no new table). Existing users stay Active.
13. Signup default role = Site attendant; Admin sets role on approve via PATCH.
14. Forgot/reset: reuse existing token/email APIs (FE pages only).
15. Admin change password: reuse `PATCH /api/users/:id` `{ password }` (Users edit).
16. Pending login message: *"Please ask the admin to approve your request."* (`PENDING_APPROVAL`).
17. Settings is bottom utility (`SETTINGS`); self-service profile + password (not admin Users PATCH).
18. Desktop `railCollapsed` separate from mobile `railOpen`; no persistence; native `title` tooltips.
19. Landing-page filters and primary CTAs live in the page body (after Go to / panel heads / collapsible), not the sticky topbar.
20. Expanded 248px / collapsed 64px via `--rail`; branding stays teal `P` + `APP`.
21. Self password change requires current password; old JWT denied and replaced so the session continues.
22. Dashboard open-tickets table removed by product ask; All tickets remains the list surface.
23. Page content fills shell width (no `1360px` cap) so open/collapsed rail does not leave a right gutter.
24. Fleet secondary status phrases use shared `Tooltip` component; legend uses equal columns.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Domain screens | Still mostly mock `src/data/` except auth, Users admin, Settings profile/password |
| Roles tab | Permission matrix save still toast/preview |
| Forgot SMTP | Dev logs reset URL when SMTP unset |
| Backend restart | New `/api/auth/me` PATCH + `/change-password` need backend process reload |

## Handoff notes

Run `npm run db:migrate` in `../backend` before testing. Restart backend after Phase 13 auth routes. Admin seed: `9000000001` / `Password123`. Do not write into `parking_maintenance/`. Desktop: sidebar brand toggle collapses/expands rail. Mobile ≤820: hamburger drawer as before. Settings: signed-in user can update profile and password.
