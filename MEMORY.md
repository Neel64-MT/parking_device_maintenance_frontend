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
  - Reported by is not rendered in the frontend; the backend continues to derive the reporter from the signed-in session
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
  - `html5-qrcode` + `QrScannerModal`; camera for any signed-in user
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
- **Deferred upload:** parents call `uploadImages` on Raise / Update / Close / Detail Add Update submit (not on each add); Raise/Update attach after ticket/update is accepted (Phase 38 / 21)
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

### Phase 24 — Image viewer zoom/rotate + Trail View Update (complete)

- Existing `ImagePreviewModal` + TicketDetail trail analyzed; no new image libraries
- Zoom in / Zoom out (1–3, step 0.25) + Rotate (+90°) via CSS transform only
- When zoomed: move pointer or drag to pan/explore clipped regions (magnifier-style scroll)
- Thumbnail change resets zoom/rotation/pan; `.img-preview-main` overflow hidden
- Trail: **View Update** on every work-history item (Modal, details only — no photos)
- **View Image** remains separate when photos exist
- `mapWorkHistory` passes `actor` / `parts` / `cost` / `nextVisit` for View Update
- Lint on touched files + production build pass

### Phase 25 — Forgot password role gate + 404 (complete)

- Backend: Admin/PM only for forgot + reset; other Active roles `403 FORGOT_PASSWORD_ROLE_DENIED`; unknown stays generic 200
- ForgotPassword: Admin/PM note; surfaces API error; Login link unchanged
- `NotFound` + `GearLoader` (theme tokens, no black panel, no styled-components); top-level `*` catch-all
- Docs updated; lint/build + backend smoke for forgot cases

### Device list live API

- `listDevices` in `services/devices.js` → `GET /api/devices` (`apiEnvelope` for tiles + pagination)
- DeviceList: live tiles/rows, Apply/Reset filters, server page/limit, skeletons; crumb from `pagination.total`
- Ticket action opens existing open ticket when present, else Raise

### Phase 26 — Device Sync frontend (complete)

- Analyzed DeviceList + `services/devices.js` + backend `POST/GET /api/device-sync`
- Sync Devices button (inline sync SVG) in JumpLinks; gated on Device list `c`
- `startDeviceSync` / `getDeviceSync` / `getLatestDeviceSync`; poll every 2s; non-blocking UI
- On complete: toast + `reloadToken` refetch (keeps page/filters); resume in-progress via `/latest`
- Table columns: Slot Id, Slot Label, Slot Identifier, QR Number (copy icon when present), Parking Location
- Backend list maps new fields (keeps legacy `id`/`qr`/`road`/`slot`)
- Lint on touched files + production build pass

### Ticket Slot Id + live Device history (complete)

- TicketList / TicketDetail: **Device** label → **Slot Id** (API `deviceId` already prefers slot_id)
- Links stay `/devices/{deviceId}`; Work report day column header → Slot Id
- DeviceDetail: live `getDevice(useParams().deviceId)`; same layout; refetch when route id changes
- `DeviceDetailSkeleton` added; mock `DEVICE_*` no longer used on history page
- DeviceAdd/Edit: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location; edit via `?id=` prefill from `getDevice`

### Phase 27 — QR scan → device → raise / update (complete)

- `resolveScan` → sticker `qr_token` → `POST /api/devices/slot-mac`; else `GET /api/devices/scan?q=` (404 → null; other errors rethrown)
- `scanDeviceFacts`: QR Number, Slot Id, Slot Label, Slot Identifier, Parking Location, Status, Open ticket
- `createTicket` (`POST /api/tickets`) + `listIssueCategories` (`GET /api/issues`); Raise IssueSelects UUID mode
- TicketRaise: Fetching device…; block when `openTicketId`; Raise create; `OPEN_TICKET_EXISTS` / `REOPEN_SAME_TICKET` → existing ticket (superseded by Phase 50: blocked per issue, not per device)
- Open / Update existing ticket → `/tickets/:id` (Detail Add Update); no Create when open
- ScanQr: live lookup, miss/error panels; Update → Detail; simulate-mock buttons removed
- Lint + production build

### Phase 27b — Update Ticket live scan (complete)

- `TicketUpdate.jsx`: live `resolveScan` (QR + manual slot); Fetching device…; miss/error EmptyState
- Open ticket → Update existing / Open → `/tickets/:id` (Detail Add Update)
- No open ticket → Raise CTA (no create on Update page)
- Removed mock `loadTicket` / TK-1042 fixed-not-fixed panels and preview button
- Docs + lint/build

### Role Update Ticket vs Add Update (complete)

- Ticket Detail: `isOpsTicketUpdater` → **Add update**; `isFieldTicketUpdater` → QR **Update Ticket** → `/tickets/update`
- Technicians/Engineers do not see Add update; Admin/PM/Control room do not see field Update Ticket on Detail
- TicketList / Dashboard JumpLink “Update a ticket” only for field updaters
- Docs + lint/build

### Manual QR Number on Raise / Update (complete)

- Raise + Update: **QR Number** field + camera scan only (Road/Slot dropdowns removed)
- Find device / Enter → `resolveScan` (same flow as camera)
- Subtitle: scan or type QR number

## Currently working on

- **Phase:** Phase 36 — Live Roles matrix + route permission guards
- **Task:** Complete — matrix Save/Create wired; RequirePerm on routes; action gates
- **File:** `Users.jsx`, `users.js`, `AuthContext.jsx`, `routes.jsx`, ticket/device/road pages, docs

- **Phase:** Phase 38 — Raise create → upload → attach photos
- **Task:** Complete — Raise matches Add Update photo order
- **File:** `TicketRaise.jsx`, `tickets.js`, backend `tickets.ts` raised photos PATCH, docs

## Pending

- Wire Close create API; Ticket Close page still design preview (Detail Add Update is live)
- External inspection package (`PROJECT_PATH` — deferred until path provided)
- Real Settings preferences beyond profile/password
- TicketList / Close still use static `ISSUE_MASTER` for some selects (Raise + Add Update use live categories)
- Run migration `007` / `009` / `010` / `015` / **`017_ticket_issues`** / **`018_site_attendant_device_sync_issue_master`** on environments that need them
- Finish / verify remaining Phase 23 Parts criteria if still Pending in PR.md
## Important decisions

> **Phase 51 supersedes every assignment item below** (18, 19g, 23, 26, 27, 35, 44, 47, 48, 50, 51 and the Phase 31 / 44 sections): there is no Assign / Reassign, no assignee gate, no Assigned tab and no assignee visibility scoping — every user with All tickets `v` sees every ticket, Update ticket `e` updates any open ticket, `x` closes. Those entries are kept as history.

1–15. Prior phases (auth, sidebar, Settings, Raise, ticket visibility API).
16. FE TicketList / Dashboard / TicketDetail consume scoped APIs; no React security filter.
17. Phase 30: Work report uses `GET /api/reports/work` (+ `/export`); From/To only for Date range; Person/Road from lookups; page gated with Work report `v`.
18. Phase 31: Detail Assign Save → `POST /api/tickets/:id/assign` with `assigneeId` from `GET /api/lookups/technicians`; optional note → `reason`; reload detail for trail/facts.
19. Phase 32: Parts “delete” = soft `PATCH { active: false }` (no hard DELETE). Issue sub delete = `DELETE` + 409→deactivate; UI gated with Issue master `d`/`e`. Image hover/pinch zoom without new libs. Crop uses `dvh` + sticky actions + larger mobile handles.
19b. Phase 34: Issue create category/sub via `POST` (`c`); category hard-delete via `DELETE` (`d`) with 409→`PATCH active:false` when `e`. Cache clear so Raise picks up new rows.
19c. Phase 35: Users create/edit role dropdown filters to same-or-below (`ROLE_HIERARCHY` in `users.js`); Users `c`/`e` still required; backend `403` remains authority; edit omits unchanged `roleId`.
19f. Phase 44: Users list is rendered as-is from the API — the backend already drops your own account and hides Admin rows from non-Admin viewers, so no client-side visibility filter exists. `deleteUser` (Users `d`, Admin only) is a deactivation: row stays as `Inactive`, Delete hidden once inactive, confirm `Modal` + `toastApi*` + `refreshUsers()`. The `row.you` marker was removed as dead. Superseded in Phase 46: delete is now a hard delete, shown on every row.
19g. Phase 45: Project manager and Control room are no longer assignable ticket holders. `listTechnicianLookups()` (`GET /api/lookups/technicians`) now returns Technician / Engineer only, so the Hand to dropdown, the All Tickets assignee filter, and the Work report person list all drop them at once. Do not re-filter in the browser; such an assignee is rejected by the API with `INVALID_ASSIGNEE`. Control room can still *perform* an assign — that is a separate rule (`canAssignTickets`).
19d. Phase 36: Roles matrix live (`GET/POST /api/roles`, `PATCH …/permissions`); `RequirePerm` on routes; action gates reuse `canPerm`; hierarchy unchanged; UI still advisory vs backend `authorize`. Phase 46 adds `deleteRole` (`DELETE /api/roles/:id`, Roles & permissions `d`, Admin only): danger `Button` beside **Permissions** in the Roles table, confirm `Modal` naming the role, `deletingRole` busy flag, `toastApiSuccess` + `refreshRoles()` on success, `toastApiError(err, 'Could not delete role.')` on failure. A role held by an **Active or Pending** account is rejected by the backend with `409 ROLE_IN_USE`, so the role stays in the list and the backend message reaches the toast — the Delete button is **not** hidden by `row.users`, because that count can be stale and the guard must stay server-side. Inactive accounts do not block the delete; they come back with `role: null` / `roleMissing: true`, render as "No role — select one", and `saveEdit` refuses `status: 'Active'` until a role is picked (backend `409 ROLE_REQUIRED`). User delete became a hard delete: shown on every row, and the confirm copy says the account is removed for good.
19c. Phase 37: Raise/Update send `issues[]`; Detail uses `issuesReported`/`issuesFound`; Site attendant Device Sync + Issue Master via BE 018 + existing `canPerm` (no role hardcode).
19e. Phase 39: Roles matrix hierarchy (`canManageRolePermissions`); `RequirePerm` on dashboard + parts; Engineer Parts create/update parity.
19. Sidebar MENU items carry `screen` keys matching `user.permissions`; hide when no view (`v`); Settings stays always visible (no perm screen); unauthorized `/users` redirects via `homePathForUser` (not always `/dashboard`).20. Update Ticket uses live scan (Phase 27b); open ticket → Detail Add Update; free → Raise.
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
32. Phase 23 — Live parts from `GET /api/parts`; labour-only `cost` + UUID `parts`; Parts page under Masters. Masters child UI labels **Issue** / **Road** / **Parts** (group **Masters**). Permission keys stay `Issue master` / `Road master`. Parts nav icon = hex nut (not Settings gear).
33. Phase 24 — Image transforms are CSS-only on the viewed image (do not rewrite files). Reset zoom/rotation/pan on thumbnail change via click handler (not an effect). When zoomed, pointer-move and drag pan explore the image (single-pane magnifier-style scroll). View Update is on every trail item and must never embed the gallery; View Image stays the only photo path.
34. Phase 25 — Forgot/email reset is Admin/PM only (backend authoritative). Explicit `FORGOT_PASSWORD_ROLE_DENIED` for other Active roles; unknown emails stay generic. 404 uses top-level catch-all + themed `GearLoader` (no styled-components / no black panel). Settings change-password remains available to signed-in users of any role.
35. Ticket list ≤760px: `.tabs-row` stacks Open/Assigned/Closed as equal-width full-width tabs above search/Raise (flex row + overflow was hiding the tab strip). Filterbar stacks at the same breakpoint. ≥761 keeps the desktop one-row tabs+actions layout.
36. Table pagination is Card Minimal right-aligned (Page X of Y + N per page left; Prev/Next right), one row at all widths including ≤560 (compact gaps; Prev short label; select stays content-sized).
37. Phase 26 — Device Sync button in JumpLinks (dark, left of Add); poll backend run status; Device list shows five sync columns only; QR Number links to history; Slot Identifier may be `—` until SmartPark provides it.
38. Ticket list/detail show **Slot Id** (not Device ID); Device history loads live by route param (slot id or PD-xxxx); same page layout, data changes with id.
39. Phase 27: one device lookup via scan API supplies `openTicketId`; Raise create uses scan `deviceId` + issue UUIDs; open-ticket Update goes to Ticket Detail.
40. Phase 27b: `/tickets/update` is live find-device only (no mock TK-1042 form); Add Update stays on Ticket Detail for ops roles.
41. Role split: field (`isFieldTicketUpdater`) → QR Update Ticket; ops (`isOpsTicketUpdater`) → Detail Add update.
42. Camera **Scan QR on the machine** is available to all signed-in users (`canScanWithCamera`).
43. Raise/Update identify device by camera scan or typed **QR Number** only (no Road/Slot dropdowns).
44. Phase 28: Raise open-ticket **Update Ticket** → `/tickets/update` with `ticketId`; Update gates via `getTicket.assigneeId === user.id`.
45. Phase 29: Update Ticket form renders on `/tickets/update` via shared `TicketAddUpdateForm` (no navigate to Detail for Update). Detail keeps Modal Add Update for trail. Prefer `?ticketId=` for refresh.
46. Phase 30: Work report is live (`getWorkReport` / `exportWorkReport`); mock `workReport.js` removed; close rate stays client-side from closed/worked.
47. Phase 31: Detail Assign/Reassign → `assignTicket` + technicians Hand to; trail from GET ticket after save.
48. Phase 44: Device list is Slot Label ascending **from the backend** (no client sort). Assign / Reassign Hand to shows only Technician / Engineer via `filterAssignableAssignees`; the ticket's current assignee is always kept in the list. Phase 47: the list is `FIELD_ROLES` (adds Electrician).
49. Phase 47: `FIELD_ROLES` / `isFieldRole` in `users.js` mirror backend `FIELD_ROLES` (Technician, Engineer, Electrician); Electrician added to `ROLE_HIERARCHY`, `NOTIFICATION_ROLES`, `isFieldTicketUpdater`. Raise stays `Raise ticket` `c` (backend migration 023 grants field roles).
50. Phase 47: Raise **Assign to** is optional (default **Assign later**), only with All tickets `a`; `createTicket` sends `assigneeId` only when picked; backend `403` for non-assigners.
51. Phase 47: Adding an update to an **unassigned** ticket is allowed for field roles (backend claims it for the updater inside the update transaction, trail "Auto-assigned on update") and for Admin/PM with a required **Assign to** (`handoverToUserId`). Supersedes item 44's "unassigned → toast" for those roles. An assigned ticket's assignee never changes on update. `409 TICKET_ALREADY_ASSIGNED` → toast + reload. The self-assign is silent (no notification, push, or sound); only an Admin / PM / Control room assignment notifies.
52. Phase 47: `TicketAddUpdateForm` has **Close Ticket** Yes / No (default No, reset to No, Update ticket `x` only). Yes sends `closeTicket: true` → backend saves the update and closes in one transaction; photos still attach afterwards. **Resolve** on Detail reuses the same modal with `Site visit — resolved` preset and Close still No. `/tickets/close` unchanged.

### Phase 30 — Work Report API (complete)

- Migrated from static `REPORT` to `GET /api/reports/work`
- Export → `GET /api/reports/work/export` (CSV download)
- Person options: `GET /api/lookups/technicians`; Road: `listRoadLookups`
- Phase 44 note: this lookup is **not** narrowed to Technician / Engineer — Control room and Project manager are valid report actors. Only the ticket Assign / Reassign dropdowns filter.
- Filters: view, person, road; from/to only when Date range
- Auth: `canPerm(..., 'Work report', 'v')` → else Navigate home
- Loading SkeletonTable; EmptyState when no people; toastApiError on failure
- Files: `src/services/reports.js`, `WorkReport.jsx`, `listTechnicianLookups` in `users.js`; deleted `src/data/workReport.js`
- Status: Complete

### Phase 31 — Ticket Detail assign (complete)

- `assignTicket` → `POST /api/tickets/:id/assign` `{ assigneeId, reason? }`
- Hand to: `listTechnicianLookups` (UUID); controlled optional note
- Phase 44: Hand to options are passed through `filterAssignableAssignees` → Technician / Engineer only, current assignee pinned (both TicketList inline modal and TicketDetail).
- Save validates worker; busy button; Cancel resets without API
- Success toast + `reloadTicket()` for Assigned to fact + `assignmentTrail`
- Trail `when` formatted; empty: `No assignment history.`
- Status: Complete

### Phase 32 — Master delete + image zoom/crop (complete)

- PartMaster: confirm Modal before soft deactivate (`PATCH` active false); Issue `e` or Technician
- IssueMaster: live `GET /api/issues`; sub Delete (`d`) / Deactivate on use or 409; category soft-deactivate (`e`)
- `ImagePreviewModal`: hover pointer-position zoom + pinch/pan; Reset control
- `CameraCaptureModal`: viewport-capped crop, sticky actions, larger mobile handles
- Status: Complete

### Phase 34 — Issue Master create + category hard delete (complete)

- `createIssueCategory` / `createIssueSubcategory` / `deleteIssueCategory` in `issues.js`
- IssueMaster inline create forms wired (`c`); category Trash → hard delete (`d`); 409 → deactivate if `e`
- Sub edit/delete unchanged; Raise Ticket benefits from cache clear
- Status: Complete

### Phase 35 — Users role hierarchy UI (complete)

- `ROLE_HIERARCHY` + `filterAssignableRoles` in `services/users.js` (mirrors backend)
- Users create/edit role selects show same-or-below only; create disabled when none
- Edit PATCH omits `roleId` when unchanged
- Status: Complete

### Phase 36 — Live Roles matrix + route guards (complete)

- Roles tab: live list + controlled checkboxes + Save (`updateRolePermissions`) + Create role
- `RequirePerm` wraps routes; Raise/Update/Close/Scan/Roads action gates via `canPerm`
- After saving own role matrix, `AuthContext.refresh()` reloads `/me`
- Status: Complete

### Phase 39 — Roles hierarchy + route holes (complete)

- `canManageRolePermissions` — Save/checkboxes only for same-or-below roles
- `RequirePerm` on `/dashboard` (Dashboard `v`) and `/masters/parts` (Update ticket `v`)
- Parts nav uses Update ticket `v`; PartMaster Engineer create/update parity with Technician
- Status: Complete

### Phase 37 — Multi-issue + Site attendant Sync / Issue Master (complete)

- `TicketIssueRows` + Raise/Update send `issues[]`; Detail shows `issuesReported` / `issuesFound`
- Site attendant preview ROLES: Device list `vc....`, Issue master `vce..d` (BE 018); Sync/CRUD via existing `canPerm`
- Status: Complete

### Phase 38 — Raise create → upload → attach photos (complete)

- Backend: raise response includes `eventId`; `PATCH /api/tickets/:id/raised/:eventId/photos`
- FE: `createTicket` (`photos: []`) → `uploadImages` → `attachTicketRaisePhotos`; partial photo fail still opens ticket
- Status: Complete

## Important decisions (detail)

> Items 30–35 (ownership visibility, `new` / `asg` tabs, assigned Open → Under repair for the Assigned tab) are superseded by Phase 51 (tabs `open` / `cls`, every ticket visible; the legacy Under repair display remains for historical assigned tickets only).

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
35. Raise network order (Phase 38): create ticket first (`photos: []`), then uploads, then `PATCH …/raised/:eventId/photos` — same rationale as Add Update; photo failure after create still navigates to the ticket.

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Domain screens | Close create still mock; Raise create + Detail Add Update + Work report are live |
| Manual Raise slots | Static `SLOTS` may 404 against live DB — surface miss; no full device-list fetch |
| Inspection package | `PROJECT_PATH` deferred until product supplies path |
| Roles tab | Live matrix via `/api/roles` (Phase 36); PM remains view-only without Roles `e` |
| Forgot SMTP | Dev logs reset URL when SMTP unset |
| Status migration | Environments that never ran `007` may still store `New` (API/FE normalize display) |
| Backend restart | Restart backend after Phase 17 scan shape, Phase 18 visibility, Phase 19 `tabForStatus` / `listStatus` / `daysAfterClose`, Phase 21 update/photos attach routes, and Phase 26 list field mapping / device-sync |
| Slot Identifier | Often null until SmartPark QR sample includes `slot_identifier` / `mac_address` |
| Sync MAC skip | Backend does not yet skip rows missing MAC; FE only surfaces `devicesSkipped` from API |

### Device list status tiles → filter (complete)

- DeviceList status tiles no longer link Under repair / Not working to `/tickets`
- Tile click sets draft + `applied.status` and `page=1`; Total devices → `All`
- Refetch via existing `listDevices({ status })`; JumpLinks All tickets unchanged
- Lint + production build pass

### Flat All tickets nav (Site attendant / Technician)

- `filterMenuByView` promotes lone All tickets leaf to top-level for Site attendant and Technician
- Other roles keep Tickets submenu (All tickets / Work report when permitted)
- All tickets icon (`ticket-list`): ticket stub + list lines — same glyph for every role

### Device Sync result stats (complete)

- Complete toast shows Created / Updated / Skipped from `run.stats` when present
- List still refreshes via `reloadToken`; validation/upsert remains backend SoT
- Lint + production build pass

### Phase 39 — New-ticket notifications (complete)

- Added `services/notifications.js` for the backend notification list/count/read and VAPID subscription contracts.
- Added one `useTicketNotifications` owner in `AppLayout`; the topbar bell, Tickets parent, and All tickets child share the backend unread count.
- Added `NotificationBell` with latest notifications, unread/read state, mark-one/mark-all actions, permission guidance, and existing ticket-route navigation.
- Added `public/sw.js` for the backend Web Push payload and notification click relay; no WebSocket/SSE or second service worker.
- Bundled `public/sounds/elevenlabs-achievement-unlock.mp3`; play it on a new push or unread-count increase, including an open background tab, with duplicate-event debounce and autoplay-safe failure handling.
- Browser permission is requested only from the explicit Enable action; denied/unsupported/unavailable states do not repeatedly prompt.
- Existing `/tickets/:ticketId` route and TicketDetail 403/404 handling remain authoritative.
- `npm run build` and `npm run lint` pass.
- Known backend follow-up: unrelated Control Room notification payloads may contain a ticket URL that ticket detail correctly rejects with 403; frontend does not bypass that authorization.
- Opening a ticket now marks that ticket's notifications read. `services/notifications.js` gained `markTicketNotificationsRead(ticketId)` → `POST /api/notifications/ticket/:ticketId/read`; the hook watches `location.pathname` for `/tickets/:ticketId` and calls it once per ticket (`lastTicketRef`), so list, search, device history, direct URL and notification clicks are all covered without a new navigation path.
- The count uses the backend's authoritative `updated` (`Math.max(0, count - updated)`) then re-reads `unread-count`; only the viewed ticket's rows are patched in `items`, so other tickets stay unread. The backend scopes the update to `recipient_user_id`, so one user can never mark another's row. A failure sets the existing `listError` and never blocks the ticket.
- Assignment / reassignment notifications exist in the backend (`createTicketAssignmentNotification`, types `ticket.assigned` / `ticket.reassigned`, called from raise-with-assignee, assign/reassign and update handover, idempotent via the existing unique key). Frontend needed no new transport: the popover, sound and badge already consume any backend row.
- `canReceiveTicketNotifications` widened to `['Admin', 'Project manager', 'Control room', 'Technician', 'Engineer']`, matching backend `NOTIFICATION_DELIVERY_ROLES`, so an assignee is never un-alertable. Site attendant and AMC officer stay excluded because they are never eligible assignees.
- `NotificationBell` attribution is now type-aware via `notificationAttribution(item)`: `raisedBy` is checked first so new-ticket rows are unchanged, `assignedBy` is the fallback, and a payload with neither omits the line. The title fallback changed from the raise-specific "New ticket raised" to the neutral "Ticket notification".
- View Update now groups structured reported/found issue categories and sub-categories in readable cards when present, hides the issue section when absent, and keeps legacy scalar fallback.
- Ticket list `updates` now counts only events emitted by the Update Ticket flow (`visit_open`, `visit_resolved`, `waiting_spare`, `reclassified`), regardless of technician, engineer, admin, project manager, or control room actor; raised/assigned/closed events are excluded.
- Update issue selection now starts blank instead of seeding reported/found pairs; the user chooses the category and sub-category.
- Update parts use one **Parts were changed** radio with a single **Yes** option; order is searchable dropdown, selected removable tags, Labour / other charges, then a cost summary showing Parts Total, optional Labour / other charges, and Total Amount. Labour rejects negative values; existing `parts` / `cost` payload fields are unchanged.

### Phase 44 — Slot Label order + Assign dropdown role filter (complete)

- Device list renders Slot Label ascending with **zero frontend code**: `GET /api/devices` orders by `devices.slot_number` in SQL (backend `DEVICE_LIST_ORDER_BY`), so the order survives `LIMIT/OFFSET` pagination. Client-side sorting was rejected because it would only order the current page. Filters, search, status tiles, columns, and the `TablePagination` behavior are unchanged.
- `services/users.js` gained `ASSIGNABLE_ASSIGNEE_ROLES = ['Technician', 'Engineer']` (the real `roles.name` values, next to the existing `NOTIFICATION_ROLES` list) and `filterAssignableAssignees(options, currentAssigneeId, currentAssigneeName)`.
- Both Assign / Reassign "Hand to" dropdowns — `TicketList.jsx` inline modal and `TicketDetail.jsx` — now map the filtered list. Role comes from the `role` field the backend already returns in `GET /api/lookups/technicians`; no hardcoded display labels and no new users API.
- The current assignee is always kept in the options, so a ticket held by a Control room / Project manager user still shows its selection in the select and can still be reassigned away from them (no silent blank prefill).
- `WorkReport.jsx` deliberately keeps the **full** lookup — Control room / Project manager are valid report actors. Backend `assertEligibleAssignee` is untouched, so the server stays the final source of truth; no user was deleted, no role changed, and the global Users list is unaffected.
- `npm run lint` and `npm run build` pass. Backend `npm run build`, `test:smoke:writes`, `test:smoke:close` pass, and `test:smoke` gains `OK devices Slot Label ascending`.

### Phase 49 — Per-issue Open/Resolved (complete)

- Backend `issuesReported[]` now carries `id` + `status`; `openReportedIssues()` in `ticketIssueRowsHelpers.js` is the single filter for what may be resolved.
- `TicketAddUpdateForm` `openIssues` prop → **Resolve issues** chips (existing `.chip` pattern) → `resolveIssueIds` on the same POST. Used unchanged by TicketDetail (Add update + Resolve) and TicketUpdate (`/tickets/update`, QR) — no role- or QR-specific branches.
- `409 ISSUE_ALREADY_RESOLVED` joins `TICKET_ALREADY_ASSIGNED` (removed in Phase 51) on the `onConflict` reload path, so a stale form refreshes from the backend.
- Decisions: only reported issues have state; the found-on-site rows are unchanged; resolving the last issue never closes the ticket; closing resolves the rest on the server (Close page shows a hint).
- Detail "As reported" pills + View Update "Resolved issues"; Dashboard subtitle from `openIssues` / `openTicketsCount`.
- Phase number 49 (backend `MEMORY.md` already used 48 for field-role visibility).

### Phase 50 — Several open tickets per device (complete)

- Backend detects duplicates by issue (device + Open reported issue). A device may hold several open tickets; a raise after close always creates a new ticket (7-day `REOPEN_SAME_TICKET` removed). Scan adds `openTickets[]` with each ticket's Open issues only.
- `data/scanDevice.js`: `scanOpenTickets`, `openTicketIssueLabel`, `findOpenIssueDuplicates` (shared by Raise and Update); `scanDeviceFacts` lists every open ticket; JSDoc + mocks updated.
- TicketRaise: device-level `dup` / `blocked` gate removed — the problem form is always available; `.reclass` lists every open ticket with its open issues (Update Ticket / Open); pre-submit duplicate check (all on one ticket → Update Ticket, else toast names); `409 OPEN_TICKET_EXISTS` uses `details.issues` and re-resolves the scan; `REOPEN_SAME_TICKET` handler removed.
- TicketUpdate (QR): exactly one open ticket auto-opens; several → pick list (open issues + **Update this ticket**) + "Raise a ticket for a different issue"; gate and form unchanged.
- Dashboard / DeviceList / DeviceDetail unchanged — the backend now counts a device once by its worst open ticket.
- `npm run lint` and `npm run build` pass; backend `test:smoke:multi-ticket` covers the API side.

### Phase 51 — Main/Sub issue panels + removal of ticket assignment (complete)

- New `components/tickets/TicketResolveIssues.jsx`: one collapsible panel per Main Issue (category) with its Sub Issues, built by `groupIssuesForResolve` (`ticketIssueRowsHelpers.js`). Panels start collapsed; **Another Issue** reveals the next raised group; **Add another issue** (hidden until a panel is opened) reuses `TicketIssueRows`. Main checkbox → `resolveCategoryIds`, sub chip → `resolveIssueIds`, new rows → `addIssues`. Resolved subs / mains are disabled.
- `TicketAddUpdateForm` takes `reportedIssues` (all reported issues) instead of `openIssues`; dropped `pickAssignee`, the found-on-site rows and the unassigned hint; `409 ISSUE_ALREADY_RESOLVED | ISSUE_ALREADY_ON_TICKET | OPEN_TICKET_EXISTS` → toast + `onConflict`.
- Assignment removed: TicketDetail Assign Modal + "Assigned to" fact; TicketList Assigned tab / column / assignee filter / Assign modal (`parseTab` → `open` | `cls`, action column = Open link, Updates always on); TicketRaise Assign to; TicketUpdate assignee gate (`loadUpdatableTicket` only refuses Closed); TicketClose Assigned to fact; `assignTicket`, `filterAssignableAssignees`, `ASSIGNABLE_ASSIGNEE_ROLES`, `isOpsTicketUpdater`; `.btn-reassign` CSS. `NOTIFICATION_ROLES` keeps `FIELD_ROLES` so old assignment alerts stay readable.
- Decisions (user): "Every Ticket, Every Road" access; raised issues listed first, new issues after ("the person working on the issue primarily focuses on resolving it").
- Verification: `npm run lint` + `npm run build` pass; backend `test:smoke:issue-groups` / `test:smoke:no-assignment` pass; browser walkthrough on TK-1283 (PD-1777) passed every step (collapsed panel, Another Issue, Add another issue gating, resolved chip disabled, main-issue resolve, add Power / MCB tripped, no `/assign` calls, no Assign UI).

### Phase 52 — Under Repair tab, clickable cards, tab transition (complete)

- All Tickets tabs `open` (raised, no update yet) / `urp` (at least one update) / `cls`; `parseTab` maps `asg` → `urp`. Backend decides membership; React never re-filters.
- Status select only on Under Repair (`All` / `Under repair` / `Waiting for spare`); `statusForTab` forces `All` elsewhere. `age=over3` (`ageForTab`) only on Open / Under Repair.
- Cards are `.tile-link` buttons: `viewForTile` → tab + status + age; `isTileSelected` drives `aria-pressed`. "Open over 3 days" picks Open when `over3Counts.open > 0`, else Under Repair.
- `Tabs` has a sliding `.tabs-ink` (DOM-positioned, also on Users / UI kit); TicketList keys the Panel by tab with `tab-pane-next|prev` and clears rows in the same render as the tab change.
- Decisions (user): Waiting for spare stays in Under Repair with its own pill; Open over 3 days → Under Repair when the old tickets have updates, Open when they do not.
- Follow-up (user): Resolve Issues lists all raised issues at once (expanded, no **Another Issue**); **Add another issue** always visible → opens the category / sub-category picker. Supersedes the Phase 51 collapsed / progressive reveal. Resolved subs and fully resolved main issues are hidden in Resolve Issues (only Open work is shown). View Update shows resolved issues as a green "Fixed in this update" card grouped by main issue ("Ticket status" label beside it). The block is now labelled **Reported Issues**, and Visited by is selectable for every user (field staff default to themselves). Visited by is still UI-only — the update POST does not send it and the backend does not store it (`lib/visited-by.ts` `assertValidVisitedBy` exists but is unused). Ticket detail on mobile (≤1080px) shows Issue classification before Work history (CSS `order`, desktop unchanged). Issue classification card uses `.issue-row` rows (pill right-aligned), "N/M resolved" per category, dashed empty state, and stacks its two columns via a container query when the card is ≤480px. Ticket detail header: pill beside the id (`.record-head` / `.record-title`, shared with Device history); ≤760px actions fill the row and wrap (no overflow at 320px).
- Verification: lint + build pass; backend `test:smoke:no-assignment` Phase 52 block passes; browser walkthrough of the three tabs, every card, Closed clearing age, ink bar and slide direction passed.

## Handoff notes

Run `npm run db:migrate` in `../backend` before testing (incl. `007_ticket_status_open.sql` / `010_device_sync.sql` when present). Restart backend after Phase 13 auth / Phase 17 scan / Phase 18 visibility / Phase 21 updates photos PATCH / Phase 26 device list field mapping. Admin seed: `9000000001` / `Password123`. Site attendant demo: `9016374408` / `Password123` (Nilesh — Science City roads; still sees tickets he raised on other roads). Do not write into `parking_maintenance/`. Desktop: sidebar brand toggle collapses/expands rail. Mobile ≤820: hamburger drawer as before. Settings: signed-in user can update profile and password. Raise/Update/Close action buttons scroll with the form (not fixed). Photos: folder or camera (overlay flip icon; crop full-width, no letterbox), max 5, upload on submit via `uploadImages` (Detail Add Update: after update succeeds). Do not wrap PhotoPicker in `<label>` (`Field` is `div.fld`). All tickets: server pagination (Rows per page 10/25/50/100). Ticket list/detail: every user with All tickets `v` sees every ticket (Phase 51). Dashboard home only for Admin/PM. QR camera: any signed-in user; live `GET /api/devices/scan?q=`. Raise open ticket → **Update Ticket** → `/tickets/update?ticketId=` → **Add Update form on Update page** (only Closed is refused; Resolve Issues panels by Main/Sub issue — Phase 51). Free device → Raise `POST /api/tickets`. Phase 50: a device may have several open tickets (one per distinct Open issue); Raise stays available for a different issue, the same Open issue goes to Update Ticket. Live screens show skeleton loaders while fetching (Phase 22). Masters submenu labels are Issue / Road / Parts; Parts icon is interlocking gears. Device list: Sync Devices (Admin/PM with Device list `c`) → `POST /api/device-sync`; complete toast may show Created/Updated/Skipped from `stats`; table shows Slot Id / Slot Label / Slot Identifier / QR Number / Parking Location. Status tiles filter the list via `status` (stay on `/devices`). Device list rows are Slot Label ascending (backend SQL, no client sort). No ticket assignment anywhere (Phase 51). All tickets tabs Open (no update yet) / Under Repair (at least one update) / Closed; summary cards select tab + filter (Phase 52). Site attendant / Technician sidebar: top-level **All tickets** (not under Tickets). **Next phase: 53.**
