# MEMORY.md — Migration Progress

## Completed

- [x] Phases 0–9 — HTML → React design-preview migration.
- [x] **Phase 10 — Auth** (login / JWT / RequireAuth).
- [x] **Phase 11 — Signup approval, forgot/reset UI, admin password**
- [x] **Phase 12 — Sidebar Settings + desktop collapse**
  - `SETTINGS` bottom utility + `/settings` route
  - Desktop `railCollapsed` + `html.rail-narrow` (`--rail-expanded: 280px`, `--rail-collapsed: 64px`)
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
- [x] **Phase 14 — Raise ticket flow + field action bars**
  - Removed Raise step 3 (Who should attend / assign / priority)
  - Reported by = signed-in user (read-only)
  - PhotoPicker kept as original compact 86×86 tile (full-width Add photo reverted)
  - `.sticky-bar` is `position: static` (not viewport-fixed) on Raise / Update / Close
  - `.sticky-bar-inner` max-width `580px` to match `.mobile`; transparent bar (no white footer strip)
- [x] **Phase 15 — Ticket visibility + PM signup approval**
  - Read paths already used `lib/ticket-access.ts` (assignee OR raised_by; Admin/PM exempt)
  - Assign: `assertRoadAccess` only (Control room can assign others’ tickets)
  - Dashboard ticket queries use `appendTicketVisibilitySql`
  - PM Users `vce...` (backend + migration 006); FE `ROLES` + approval copy synced
  - Smoke: visibility, PM approve, Control-room assign, dashboard scope — pass
- [x] **Phase 16 — FE role-scoped ticket rendering**
  - `services/tickets.js` + `services/dashboard.js` (+ `apiEnvelope` for list tiles/tabs)
  - TicketList → `GET /api/tickets` (tiles / tabs / pagination from API)
  - Dashboard → `GET /api/dashboard` (fleet / downReasons / roadStatus)
  - TicketDetail → `GET /api/tickets/:id` with 403/404 hint strip
  - No client-side security filter; Raise/Update/Close/WorkReport still mock
  - Lint + production build pass
- [x] **Phase 17 — QR scan + role routing**
  - `html5-qrcode` + `QrScannerModal`; camera for Site attendant / Technician only
  - `data/scanDevice.js` + `services/devices.resolveScan` (mock any QR; FREE/PD-0501 = no open)
  - TicketRaise: full device fields + lat/lng; block Raise when open ticket (`≠ Closed`)
  - TicketUpdate: camera then existing mock `loadTicket` panels
  - ScanQr: Open camera + simulate open/free; CTAs by open ticket
  - Backend `GET /api/devices/scan` returns structured fields + lat/lng (legacy facts kept)
  - Lint + production build pass
- [x] **Phase 18 — Home by role, Open status, Raised by, raiser visibility**
  - Post-login / index / GuestOnly: Admin & Project manager → `/dashboard`; others → `/tickets` (`homePathForUser` / `isDashboardRole`)
  - Dashboard route + sidebar Dashboard item restricted to Admin / Project manager
  - Ticket status product rule: **Open** only (no **New**); FE + BE normalize legacy `New` → `Open`; Open tab label (tab id `new` kept)
  - TicketList column **Raised by** before **Assigned to**; list API returns `raisedBy`
  - Ticket list/export: ownership visibility only (do **not** AND `assigned_roads`); raiser/assignee detail access even outside assigned roads
  - Smoke: Site attendant sees raised tickets on non-assigned roads (e.g. TK-1099)

### Phase 20 — Image attachment in ticket (complete)

- Shared `PhotoPicker`: Choose from folder / Capture from camera (`CameraCaptureModal` + `getUserMedia`)
- Camera live: overlay flip icon (front/rear); **Cancel** + **Take photo** in one row
- Camera flow: Take photo → crop/review (full-width image, no black letterbox) → Upload (confirm local File) or Recapture
- Validate `image/*` ≤8 MB; max **5** photos; object-URL thumbs until submit
- **Deferred upload:** parents call `uploadImages` on Raise / Update / Close / Detail Add Update submit (not on each add)
- Wired on Raise, Ticket Update (fixed + not-fixed), Ticket Close, Detail Add Update
- Ticket create/update/close POST still toast; photo URLs prepared after upload for future APIs
- Compact tile preserved; no new npm deps; QrScanner not reused for photos

### Phase 21 — Sidebar alignment, TicketList pagination & Add Update fixes (complete)

- Collapsed desktop rail: brand min-height matches `--topbar-h`; glyph/nav icons centered in 64px column; topbar close (X) held through collapse animation
- Shell/`--rail` sync unchanged; `TablePagination` + `constants/pagination.js` (10/25/50/100, default 25)
- TicketList wires `page`/`limit` to `listTickets`; resets page on tab/Apply/Reset/limit
- `Field` → `div.fld`; PhotoPicker revoke-only-removed URL; Ticket Update: no Hand over / Next visit; Photos before work-done
- PhotoPicker in modals: persistent hidden folder input; source menu + camera portaled to `document.body`; Add photo leftmost when empty
- Detail Add Update live: `POST /updates` → `uploadImages` → `PATCH …/updates/:eventId/photos`; button gated on `Update ticket` `e`; trail reloads
- Raise Cancel / list Raise preserve `state.from` tab where applicable
- Lint + production build expected; brand-icon asset swaps are out of this phase’s doc scope

### Phase 22 — Responsive skeleton loaders (complete)

- Shared `Skeleton` / `SkeletonText` / `SkeletonTable` / `SkeletonTiles` + page helpers in `components/ui/Skeleton.jsx`
- CSS `.sk` shimmer on `--hover` tokens; `prefers-reduced-motion` disables animation
- TicketList: tile skeletons + `SkeletonTable` in panel; filters/tabs stay visible
- TicketDetail: record / facts / `grid-2` panel skeleton while loading
- Dashboard: `DashboardSkeleton` (fleet + panels); JumpLinks/filters stay visible
- Users: tile + table skeletons
- Auth boot: `AuthBootSkeleton` in RequireAuth / GuestOnly / HomeRedirect
- Follow-up: Users create / edit / password / approve use button busy labels (`Creating…` / `Saving…` / `Updating…` / `Approving…`); Cancel/modal close disabled while busy
- Lint (touched files) + production build pass

## Currently working on

- **Phase:** —
- **Task:** —
- **File:** —

## Pending

- Wire Raise/Update/Close create APIs (photos may upload on submit; ticket POST still toast except Detail Add Update)
- Live `GET /api/devices/scan` after QR payload finalized
- External inspection package (`PROJECT_PATH` — deferred until path provided)
- Roles tab on Users still mostly preview matrix
- Real Settings preferences beyond profile/password
- Backend Work report ownership scoping (if product requires)
- Run migration `007_ticket_status_open.sql` on environments that still store status `New`

## Important decisions

1–15. Prior phases (auth, sidebar, Settings, Raise, ticket visibility API).
16. FE TicketList / Dashboard / TicketDetail consume scoped APIs; no React security filter.
17. WorkReport stays mock until backend report is ownership-scoped.
18. Phase 17: camera QR for Site attendant + Technician only; scan resolves mock until QR format finalized; open ticket = status ≠ Closed (one per device).
19. Sidebar MENU items carry `screen` keys matching `user.permissions`; hide when no view (`v`); Settings stays always visible (no perm screen); unauthorized `/users` redirects via `homePathForUser` (not always `/dashboard`).
20. Technician Update flow stays mock after scan; Site attendant Raise shows device + blocks second open ticket.
21. Phase 18: only Admin / Project manager land on and open Dashboard; other roles home to All tickets.
22. Ticket workflow status labels: Open / Under repair / Waiting for spare / Closed — never display **New**.
23. Ticket list visibility is raiser OR assignee for non–Admin/PM; do not hide a user’s own raised tickets because the device road is outside `user_roads`.
24. Phase 19: Open tab hides Updates; Closed uses Days After Close; Add Update in Modal; work history chronological; View Image gallery from event photos.
25. Ticket list → detail → Back to tickets: preserve active tab via navigation `state.from` (`/tickets?tab=…`) and TicketDetail `backToTickets` (not hard-coded `/tickets`).
26. Open tab (`new`) = unassigned only (`assignee_id` null); Assigned (`asg`) = has assignee. Backend `tabForStatus` must not put status Open/New with an assignee on Open.
27. All tickets tiles: “Open, not attended” = tab `new` (same as Open tab). Assigned tickets still stored as Open/New are `listStatus` → Under repair for list pills + Under repair tile (no DB rewrite). `tabCounts` and tiles both use `tabForStatus` / `listStatus`. “Open over 3 days” = non-closed (Open+Assigned) with daysOpen>3.
28. Phase 20 — Image attachment in ticket: folder and camera → local `File` + object-URL preview (max 5); same validate; **`uploadImages` on form submit**. Camera uses in-app `getUserMedia` modal with overlay flip icon + crop/review (Upload confirms File into picker; Recapture restarts). Crop preview is full width (no black letterbox). Camera footer is Cancel + Take photo only. No second pipeline; ticket POST remains toast until create/update/close APIs are wired (except Detail Add Update in Phase 21).
29. Phase 21 (single commit scope): never wrap PhotoPicker in `<label>` — use `div.fld`. TicketList pagination is server `page`/`limit` (10/25/50/100, default 25). Collapsed rail icons centered; shell offset remains `--rail` only. PhotoPicker menu/camera portal for Modal use; Add Update is live update→upload→attach; gate on Update-ticket `e`. Backend update access: Admin/PM, holder, unassigned claim, or raiser (close remains holder-only). Next phase number is **22**.
30. Phase 22 — Live-data loading uses shared `Skeleton` primitives (no new libs); auth boot is minimal bars, not a fake dashboard; empty/error states stay text, not skeleton.
31. Phase 22 follow-up — Users live mutations use button busy text (not skeletons); match Settings/Detail Add Update pattern.

## Important decisions (detail)

1–11. Prior phases (filters UI-only, static detail samples, responsive, Phase 10 JWT).
12. Reuse `users.status` with `Pending` (no new table). Existing users stay Active.
13. Signup default role = Site attendant; Admin sets role on approve via PATCH.
14. Forgot/reset: reuse existing token/email APIs (FE pages only).
15. Admin change password: reuse `PATCH /api/users/:id` `{ password }` (Users edit).
16. Pending login message: *"Please ask the admin to approve your request."* (`PENDING_APPROVAL`).
17. Settings is bottom utility (`SETTINGS`); self-service profile + password (not admin Users PATCH).
18. Desktop `railCollapsed` separate from mobile `railOpen`; no persistence; native `title` tooltips.
19. Landing-page filters and primary CTAs live in the page body (after Go to / panel heads / collapsible), not the sticky topbar.
20. Expanded 280px / collapsed 64px via `--rail`; brand header height matches topbar.
21. Self password change requires current password; old JWT denied and replaced so the session continues.
22. Dashboard open-tickets table removed by product ask; All tickets remains the list surface.
23. Page content fills shell width (no `1360px` cap) so open/collapsed rail does not leave a right gutter.
24. Fleet secondary status phrases use shared `Tooltip` component; legend uses equal columns.
25. Raise ticket does not assign on create; reported-by comes from session.
26. Field-flow action bars stay in document flow (`position: static`); do not pin to viewport unless product asks again.
27. Add photo stays the compact dashed tile; do not full-bleed without product ask.
28. `homePathForUser` / `isDashboardRole` in `services/users.js`; `HomeRedirect` in AuthContext; Login deep-links skip `/dashboard` for non–Admin/PM.
29. Legacy DB status `New` mapped to Open in API responses; prefer migration `007_ticket_status_open.sql` to rewrite rows.
30. Ticket list must not combine `assigned_roads` AND ownership in a way that drops raiser rows on other roads.
31. When linking from TicketList to TicketDetail, pass `state={{ from: `/tickets?tab=${tab}` }}` so crumb/back restore the same Open/Assigned/Closed tab.
32. Backend `tabForStatus`: Closed → `cls`; `!assignee_id` → `new`; else → `asg` (do not put status Open with assignee on Open tab).
33. Backend `listStatus` (list + tiles only): assignee + Open/New → Under repair for pills/tile counts; no DB rewrite. Open over 3 days = all non-closed with daysOpen > 3.
34. Detail Add Update network order: updates first, then uploads, then attach photo URLs — avoids orphan uploads on 403.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Domain screens | Raise/Update/Close/WorkReport create still mock; Detail Add Update is live |
| QR payload | Live `GET /api/devices/scan` not wired yet; FE `resolveScan` mock until format finalized |
| Inspection package | `PROJECT_PATH` deferred until product supplies path |
| Roles tab | Permission matrix save still toast/preview |
| Forgot SMTP | Dev logs reset URL when SMTP unset |
| Status migration | Environments that never ran `007` may still store `New` (API/FE normalize display) |
| Backend restart | Restart backend after Phase 17 scan shape, Phase 18 visibility, Phase 19 `tabForStatus` / `listStatus` / `daysAfterClose`, and Phase 21 update/photos attach routes |

## Handoff notes

Run `npm run db:migrate` in `../backend` before testing (incl. `007_ticket_status_open.sql` when present). Restart backend after Phase 13 auth / Phase 17 scan / Phase 18 visibility / Phase 21 updates photos PATCH. Admin seed: `9000000001` / `Password123`. Site attendant demo: `9016374408` / `Password123` (Nilesh — Science City roads; still sees tickets he raised on other roads). Do not write into `parking_maintenance/`. Desktop: sidebar brand toggle collapses/expands rail. Mobile ≤820: hamburger drawer as before. Settings: signed-in user can update profile and password. Raise/Update/Close action buttons scroll with the form (not fixed). Photos: folder or camera (overlay flip icon; crop full-width, no letterbox), max 5, upload on submit via `uploadImages` (Detail Add Update: after update succeeds). Do not wrap PhotoPicker in `<label>` (`Field` is `div.fld`). All tickets: server pagination (Rows per page 10/25/50/100). Ticket list/detail: Admin/PM all; others assignee or raised_by (list not road-AND’d). Dashboard home only for Admin/PM. QR camera: Site attendant / Technician; mock scan defaults to open TK-1042; use PD-0501 or FREE for a free device. Live screens show skeleton loaders while fetching (Phase 22). **Next phase: 23.**
