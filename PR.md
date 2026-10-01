# PR.md — Project Requirements

## What to build

Migrate the existing **Parking Device Maintenance** design-preview website from vanilla HTML/CSS/JavaScript to a **React + Tailwind CSS** application, preserving visual appearance, layout, interactions, and documented product rules.

| | Path |
|---|---|
| **Original (READ-ONLY)** | `C:\Users\MTPC-359\Desktop\Project\parking_device_maintenance\parking_maintenance` |
| **Destination** | This React project (`parking_device_maintenance/frontend`) |

This is a **migration, not a redesign**. The user should not be able to tell the underlying stack changed from normal UI use.

The destination already exists as a Vite + React scaffold. Migration work continues here: add Tailwind, React Router, layout, pages, shared UI, and mock data equivalent to the original preview.

### Sources of truth

1. **Original HTML/CSS/JS** — actual UI, interactions, and sample data to reproduce.
2. **Product scope** — Claude conversation (share `12b4ac7c-e8d9-4b1d-b1cf-ca8db5cc63bd`) and the binding skill at `.cursor/skills/parking-device-maintenance/SKILL.md`. Later decisions in that scope override earlier ones for product rules; original code wins for visual layout and existing screens.

Where scope and code differ, see **Gaps vs Claude scope** below.

---

## Target users

| Role | Typical use |
|------|-------------|
| **Site attendant** | Scan QR / pick road+slot, raise tickets on assigned roads |
| **Technician** | Update visits on site and close any open ticket (no holder since Phase 51), mobile-first flows |
| **Engineer / Electrician** | Same field rules as Technician: raise, update and close any open ticket |
| **Control room** | Raise and watch every ticket; cannot update (by default) or close |
| **Project manager** | Dashboard, reports, masters, update/close; manage users / approve signups (Users `vce...`) |
| **Admin** | Full control including users and roles |
| **AMC officer** | View-only across roads |

Preview UI originally hardcoded user **Alkesh P. / Project manager** in the sidebar. **Phase 10** added real login against the sibling backend. **Phase 11** adds self-signup with admin approval, forgot/reset password UI, and admin change-password on Users. **Phase 12** adds Settings in the sidebar bottom utility + desktop rail collapse. **Phase 13** wires Settings account forms (profile + password) and shell/dashboard UX polish. **Phase 14** simplifies Raise ticket (no assign step) and makes field-flow action bars in-document (not fixed). **Phase 18** sends only Admin / Project manager to Dashboard after login; other roles land on All tickets.

---

## Features

### Existing in original (must preserve)

#### Information architecture

**Menu landing pages only**

- Dashboard
- Tickets → All tickets, Work report
- Devices
- Masters → Issue, Road, Parts
- Users
- Settings (bottom utility above company/version — self-service profile + password)

**Flows (not menu items; parent menu stays highlighted)**

| Flow | Path |
|------|------|
| Raise | Tickets list → Raise ticket → list |
| Attend | List → Ticket detail → Update on site → Close |
| Field | Devices → Scan QR → raise / update / history |
| Add device | Devices → Add device (+ link to Add road) |
| History | Devices → device id → Device history |
| ~~Assign~~ | Removed in Phase 51 — anyone with Update ticket `e` works any open ticket |

#### Screens (15 HTML pages)

1. Dashboard — fleet strip, why-down ranked bars, road-wise table (open-tickets table removed in Phase 13)
2. All tickets — clickable tiles, filters, Open / Under Repair / Closed tabs (Phase 52), table (Raised by, no Assigned to); ticket status **Open** (not New)
3. Raise ticket — scan/manual device via live scan API; open ticket → Detail update; else problem form + live `POST /api/tickets`; PhotoPicker upload on submit; Cancel / Raise in page flow
4. Update ticket — live scan/manual find device; open ticket → Detail Add Update; free device → Raise; miss/error states
5. Close ticket — mobile-first: final issue, resolution, cost, photos (upload on confirm), confirm
6. Ticket detail — record header, work history timeline, classification; Add Update / Resolve modal with Main/Sub issue panels and PhotoPicker (Assign/Reassign removed in Phase 51)
7. Work report — Day/Week/Month/Range via live `GET /api/reports/work`; team strip + per-person panels; Export CSV; Person/Road from lookups
8. Device list — tiles (click → `status` filter on same page), filters, table (Slot Id / Slot Label / Slot Identifier / QR Number / Parking Location); Sync Devices (Phase 26)
9. Device history — record, life stats, split ticket/resolution table, parts, timeline
10. Add device — identity, location, installation form
11. Scan QR — live camera / manual find + result / miss / error; branch raise vs update
12. Issue — category pick list + sub-category table
13. Road — filters + roads table
14. Add road — road details, capacity/rate, status/contact
15. Users — Users tab + Roles & permissions matrix
16. Settings — profile (name/email/mobile) + change password
17. Parts — list/create/edit/deactivate spare parts (Masters; hidden from Site attendant)

#### Shared chrome

- Fixed navy sidebar (`nav.js` MENU + icons)
- Sticky topbar (title, crumb, page-body actions preferred, user chip + logout icon with confirm modal)
- Mobile hamburger drawer at ≤820px (`railOpen`)
- Desktop expand/collapse icon-rail ≥821px (`railCollapsed`; expanded 280px / collapsed ~64px)
- Settings link in sidebar bottom section above EXILIO / version
- Toast notifications
- Jump pill strips on landing pages (optional right-side actions)
- Interlinked codes (ticket, device, road)

#### Domain behavior (preview / UI rules)

- Issue category → sub-category cascading selects from `ISSUE_MASTER`
- Part chips from `PART_MASTER`
- Duplicate open-ticket warning on raise (demo for PD-0428)
- Reclassification amber strip on update/detail
- Device status shown as Working / Under repair / Not working (derived); Device list status tiles apply `GET /api/devices?status=` and stay on `/devices` (not navigate to tickets)
- Cost only where original shows it (visit/close, device history totals, work report footers — not dashboard fleet as primary cost UI)
- Forms do not post; toast “Design preview — this form is not connected yet.”
- Table client-side search
- Tabs, view switchers, inline forms, photo picker placeholders

### Mentioned in product scope but not in original UI

| Item | Notes |
|------|--------|
| Real login / session / tokens | **Phase 10 done** — `/login`, Bearer JWT, `/signup` ask-admin only |
| Live camera QR scanning | Simulated button only |
| Backend APIs / persistence | Auth + Users list/create/edit + Settings profile/password; other screens still mock `src/data/` |
| Empty / loading / error states for async | Auth boot + login/settings errors; other screens mostly static |
| Enforce “one open ticket” server-side | UI warning only in preview |
| 7-day reopen same ticket | Documented in copy; not implemented |
| OEM role | Spec lists OEM; original roles use Site attendant instead |
| TypeScript domain types | Recommended for React; not in original |

Auth and further API wiring are approved beyond migration parity. Migration phases 0–9 reproduce the **design preview**; Phase 10 is the first backend-connected work.

### Explicitly out of scope (do not add)

Per product skill — unless the user asks again:

- Preventive maintenance, inventory, SLA, live health map
- SIM / battery / solar / charge controller on devices
- Part numbers, manufacturer serials, warranty dates
- Cost on list/dashboard/master pages, “cost borne by”, liability flags
- Issue codes like `CT-01` — names only
- Manual device status as a long-term editable field (add-device form has an install-time status select with hint that post go-live status is derived — preserve that UI as in original)
- Second open ticket freely created
- Top-level menu links for raise / update / close / detail / add device / history / scan QR

---

## Non-functional requirements

- **Visual parity** with `asset/style.css` tokens and components
- **Responsive parity** at original breakpoints (820, 760, 900, 940, 1080)
- **Manual maintainability** — conventional React, shallow folders, no over-abstraction
- **Documentation** kept current: PR, ARCHITECTURE, RULES, DESIGN, MEMORY, PHASES, SKILLS
- **Original project remains read-only**

---

## Success criteria

A reviewer comparing original HTML pages side-by-side with React routes cannot spot intentional redesign differences in layout, typography, color, spacing, or primary interactions. All 15 screens exist as routes. Shared nav/menu matching works. Field flows remain mobile-first; action bars follow document flow (not viewport-fixed) after Phase 14.

### Phase 9 verification (signed off)

| Criterion | Result |
|-----------|--------|
| 15 screens as React routes | Pass — see `src/routes.jsx` |
| No `.html` hrefs in app code | Pass |
| Nav `pageId` / `match` highlights | Pass |
| Forms `preventDefault` + toast | Pass |
| Tabs (tickets, users, report views) | Pass |
| Scan QR hit/miss | Pass |
| Lint clean (`npm run lint`) | Pass (`.vite` / `dist` ignored) |
| Production build | Pass |
| Original `parking_maintenance/` unmodified | Pass (read-only throughout) |
| Known preview gaps documented | Pass — see MEMORY.md |

### Phase 10 — Auth (approved)

| Criterion | Result |
|-----------|--------|
| `/login` email or mobile + password | Pass — `POST /api/auth/login` via Vite proxy |
| `/signup` informational (no self-register) | Superseded by Phase 11 self-signup + approval |

### Phase 11 — Signup approval, forgot password, admin password

```text
Signup → Pending → Admin review / update role → Approve → Login
Login before approval → rejected: "Please ask the admin to approve your request."
Login → Forgot password → email link → Reset password → Login
Admin → Users → Change password (PATCH /api/users/:id)
```

| Criterion | Result |
|-----------|--------|
| `/signup` self-register → Pending | Pass |
| Pending login blocked (`PENDING_APPROVAL`) | Pass |
| Reuse existing forgot/reset APIs + FE pages | Pass |
| Admin password via existing PATCH | Pass |
| Existing Active users unaffected | Pass |
| Backend smoke (`npm run test:smoke`) | Pass |

### Phase 12 — Sidebar Settings + desktop collapse

| Criterion | Result |
|-----------|--------|
| Settings bottom utility + `/settings` route | Pass (content filled in Phase 13) |
| Desktop expand/collapse with smooth width/text | Pass |
| Collapsed: icons only + native `title` tooltips | Pass |
| Mobile drawer unchanged (full labels) | Pass |
| Branding: teal `P` + `APP` title (glyph-only when collapsed) | Pass |
| No new icon/state libraries; no collapse persistence | Pass |

### Phase 13 — Settings account + shell / dashboard UX

```text
Settings → Profile (name, email, mobile) → PATCH /api/auth/me
Settings → Password (current + new) → POST /api/auth/change-password → new JWT
Topbar → logout icon → confirm modal → POST /api/auth/logout
Dashboard → fleet legend tips via Tooltip; open-tickets panel removed
Shell → page fills available width (no 1360px cap); panel foot notes bottom-aligned
```

| Criterion | Result |
|-----------|--------|
| Settings profile save updates session user / topbar | Pass |
| Settings password requires current password; session continues | Pass |
| Logout icon + confirmation before logout | Pass |
| Landing filters/CTAs in page body (not sticky topbar) | Pass |
| Fleet secondary status copy in Tooltip; four legend columns aligned | Pass |
| Dashboard open-tickets table removed (All tickets remains) | Pass |
| Page content uses full shell width (sidebar open or collapsed) | Pass |

### Phase 14 — Raise ticket flow + field action bars

```text
Raise ticket → steps 1–2 only (device + problem)
Reported by → not rendered; backend derives the reporter from the signed-in session; assignment left to Admin / control room
PhotoPicker → original compact 86×86 dashed tile (not full-width strip)
Problem fields → Photos first, then **What is happening**
Action bar → .sticky-bar position:static; .sticky-bar-inner max-width 580px (match .mobile)
No white full-bleed footer; transparent bar; Raise / Update / Close pages share pattern
```

| Criterion | Result |
|-----------|--------|
| Raise has no “Who should attend” step | Pass |
| Reported by is not shown; reporter remains session-derived in the backend | Pass |
| Photos appear before What is happening | Pass |
| Add photo remains compact tile | Pass |
| Cancel / primary actions not `position: fixed` | Pass |
| Action row width matches mobile form (`580px`) | Pass |

### Phase 15 — Ticket visibility + PM signup approval

| Criterion | Result |
|-----------|--------|
| Non–Admin/PM ticket list/detail: assignee OR raised_by only | Pass (Phase 18: list not road-AND’d) |
| Admin/PM city-wide ticket visibility preserved | Pass |
| Assign uses road access (Control room can assign) | Pass |
| Dashboard open-ticket queries respect visibility | Pass |
| PM Users `vce...` + approve via existing PATCH | Pass |
| FE ROLES matrix mirrors PM Users | Pass |

### Phase 16 — Frontend role-scoped ticket rendering

| Criterion | Result |
|-----------|--------|
| TicketList consumes `GET /api/tickets` (no client security filter) | Pass |
| Dashboard consumes `GET /api/dashboard` scoped metrics | Pass |
| TicketDetail consumes `GET /api/tickets/:id`; 403/404 shown | Pass |
| Backend remains security boundary | Pass |
| Raise/Update/Close/WorkReport stay mock this phase | Pass |

### Phase 17 — QR scan + role routing

| Criterion | Result |
|-----------|--------|
| Camera QR via `QrScannerModal` (`html5-qrcode`) | Pass |
| Scan camera limited to Site attendant + Technician | Pass |
| Site attendant Raise: device fields + block if open ticket | Pass |
| Technician Update: camera then existing mock inspection | Pass |
| One open ticket per device (`status ≠ Closed`) | Pass |
| Scan mock includes lat/lng; live API shape aligned | Pass |

### Phase 18 — Home by role, Open status, Raised by, raiser visibility

```text
Login → Admin / Project manager → /dashboard
Login → other roles → /tickets
Ticket status → Open (legacy New normalized); Open tab label (id new)
Ticket list → Raised by column; API raisedBy
Visibility → raiser OR assignee for non–Admin/PM; list not road-AND’d
```

| Criterion | Result |
|-----------|--------|
| Only Admin / Project manager open Dashboard after login | Pass |
| Other roles home to All tickets; Dashboard nav hidden / redirected | Pass |
| No **New** ticket status in UI (Open only for that state) | Pass |
| Raised by column before Assigned to | Pass |
| Raiser sees own tickets on roads outside `user_roads` | Pass |
| Backend remains ownership security boundary | Pass |

### Phase 19 — Ticket list columns + detail update/trail/images

```text
Ticket list (Open) → hide Updates; (Closed) → Days After Close; (Assigned) unchanged
Open tab = unassigned only; Assigned = has assignee (backend tabForStatus)
Tiles: Open not attended = Open tab; Under repair includes assigned+Open via listStatus
Ticket detail → Add Update in Modal (toast submit); work history ASC; View Image gallery
List → detail → Back to tickets → same tab via state.from = /tickets?tab=…
```

| Criterion | Result |
|-----------|--------|
| Open tab (`new`) hides Updates column | Pass |
| Closed tab shows Days After Close (not Days open) | Pass |
| Assigned tab keeps Updates + Days open | Pass |
| Updates count includes Update Ticket events only (`visit_open`, `visit_resolved`, `waiting_spare`, `reclassified`) for all permitted roles | Pass |
| Raised, assigned, and closed events do not increment Updates | Pass |
| Open tab shows only unassigned non-closed tickets | Pass |
| Tile “Open, not attended” matches Open tab count | Pass |
| Assigned + stored Open/New list as Under repair (tiles/pills; no DB rewrite) | Pass |
| Add Update opens existing form in Modal | Pass |
| Work history chronological (oldest → newest), always visible | Pass |
| View Image → main + thumbnail gallery when photos exist | Pass |
| Detail Back to tickets preserves list tab (`state.from`) | Pass |

### Phase 20 — Image attachment in ticket

```text
PhotoPicker → folder or camera → local File + object-URL preview (max 5)
Camera → overlay flip → Take photo → crop/review (full width) → Upload / Recapture
Form submit → uploadImages (POST /api/uploads) → toast (ticket APIs still mock)
```

| Criterion | Result |
|-----------|--------|
| PhotoPicker: Choose from folder | Pass |
| PhotoPicker: Capture from camera (live preview + overlay flip icon) | Pass |
| Camera step actions: Cancel + Take photo in one row | Pass |
| Camera crop/review with Upload / Recapture | Pass |
| Crop review image full width; no black side letterbox | Pass |
| Max 5 photos; validate `image/*` ≤8 MB client-side | Pass |
| Deferred upload: `uploadImages` on Raise / Update / Close / Detail Add Update submit | Pass |
| Raise, Ticket Update, Ticket Close, Detail Add Update use PhotoPicker | Pass |
| No new camera/upload libraries | Pass |

### Phase 21 — Sidebar alignment, TicketList pagination & Add Update fixes

```text
Collapsed rail ↔ shell/--rail · TablePagination (10/25/50/100)
Field = div.fld · PhotoPicker portal (menu + camera) · Add photo leftmost when empty
Add Update → POST /updates → uploadImages → PATCH …/photos · canPerm Update ticket e
```

| Criterion | Result |
|-----------|--------|
| Desktop collapsed rail: icons centered in 64px column; shell/`--rail` sync | Pass |
| Topbar stays aligned with shell when rail open/collapsed; close (X) held through collapse animation | Pass |
| Mobile drawer (≤820) unchanged | Pass |
| TicketList server `page`/`limit`; options 10 / 25 / 50 / 100; default 25 | Pass |
| Limit change / tab / Apply / Reset → page 1; Prev/Next; no full-dataset client slice | Pass |
| `Field` is a `div.fld` (not `<label>`); first photo × does not wipe other thumbs | Pass |
| Ticket Update drops Hand over + Next visit planned; Photos before work-done text | Pass |
| PhotoPicker works in Add Update modal (folder + camera); no visible native file control | Pass |
| Detail Add Update: update API first, then uploads, then attach photos; trail reloads | Pass |
| Add Update button gated on `Update ticket` edit (`e`) | Pass |

### Phase 22 — Responsive skeleton loaders

```text
Skeleton / SkeletonTiles / SkeletonTable → TicketList, TicketDetail, Dashboard, Users, Auth boot
```

| Criterion | Result |
|-----------|--------|
| Shared Skeleton primitives + CSS shimmer (reduced-motion off) | Pass |
| TicketList: tiles + table skeleton while loading | Pass |
| TicketDetail: record/facts/panels skeleton while loading | Pass |
| Dashboard: fleet + grid panels skeleton while loading | Pass |
| Users: tiles + table skeleton while loading | Pass |
| Auth boot: minimal skeleton (not fake dashboard) | Pass |
| Empty/error paths unchanged; no new libraries | Pass |
| Users create/edit/password/approve: button busy labels (no double-submit) | Pass |

### Phase 23 — Parts & visit cost

```text
GET /api/parts → PartChips (UUID multi-select) → POST /updates { parts, cost: labour } → server cost
```

| Criterion | Result |
|-----------|--------|
| Parts loaded from `GET /api/parts` (cached); not hardcoded on live flows | Pending |
| PartChips show name + amount; select multiple by id | Pending |
| Add Update submits UUID `parts` + labour-only `cost` | Pending |
| Toast/trail use backend `cost` / parts snapshots | Pending |
| Ticket Update binds parts/labour; POST when ticketId known | Pending |
| No client authoritative part-cost math; no edit-update API | Pending |
| Parts under Masters (after Road); hidden from Site attendant | Pending |
| Masters child labels drop “master” postfix (Issue / Road / Parts); Parts nav icon = interlocking gears | Pending |
| Lint/build on touched files | Pending |

### Phase 24 — Image viewer zoom/rotate + Trail View Update

```text
Trail → View Update → Modal (details only, no photos)
Trail → View Image → ImagePreviewModal → Zoom In / Zoom Out / Rotate / Pan when zoomed
```

| Criterion | Result |
|-----------|--------|
| ImagePreviewModal Zoom in / Zoom out / Rotate | Pass |
| When zoomed, move or drag over image to explore (pan) | Pass |
| Rotation does not modify original image file | Pass |
| Zoom/rotation/pan reset when selecting another thumbnail | Pass |
| Gallery thumbnails + multi-image behavior preserved | Pass |
| View Update on every work-history item | Pass |
| View Update shows trail fields only (no image) | Pass |
| View Image remains a separate action when photos exist | Pass |
| No extra API call for View Update | Pass |
| No new image-viewer dependency | Pass |
| Lint on touched files + production build | Pass |

### Phase 25 — Forgot password role gate + 404 page

```text
Forgot password → Admin / Project manager only (API 403 FORGOT_PASSWORD_ROLE_DENIED for other Active roles)
Unknown routes → NotFound + GearLoader (themed, no black panel)
```

| Criterion | Result |
|-----------|--------|
| Admin / Project manager forgot-password still sends reset (generic OK) | Pass |
| Other Active roles get explicit 403 / `FORGOT_PASSWORD_ROLE_DENIED` | Pass |
| Unknown email still generic 200 (no existence leak) | Pass |
| Reset-password rejects non–Admin/PM tokens with same code | Pass |
| Forgot page shows Admin/PM note + API error message | Pass |
| Login Forgot password link remains | Pass |
| Unknown route shows 404 page with gear animation | Pass |
| GearLoader uses theme tokens; no black background; no styled-components | Pass |
| Lint/build on touched files | Pass |

### Phase 26 — Device Sync frontend

```text
Device list → Sync Devices → POST /api/device-sync (202 started)
  → poll GET /api/device-sync/:id → completed | failed → refresh list
Table columns → Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location
```

| Criterion | Result |
|-----------|--------|
| Sync Devices button with sync icon on Device list | Pass |
| Button calls our backend `POST /api/device-sync` (not SmartPark) | Pass |
| Non-blocking UI; button shows Syncing... and stays disabled while run is `started` | Pass |
| Poll `GET /api/device-sync/:id`; toast on start / complete / fail | Pass |
| Complete toast may include Created / Updated / Skipped from `run.stats` | Pass |
| Backend is source of truth for skip/upsert; FE does not invent devices | Pass |
| Resume in-progress sync via `GET /api/device-sync/latest` on mount | Pass |
| Duplicate click / `409 SYNC_IN_PROGRESS` handled | Pass |
| Device table shows only the five sync columns | Pass |
| List API maps `slotId` / `slotLabel` / `slotIdentifier` / `qrNumber` / `parkingLocation` | Pass |
| Pagination 10/25/50/100 preserved; refresh keeps current page/filters | Pass |
| Gated on Device list `c` (Admin/PM/Technician/Engineer); no new npm deps | Pass |
| Lint on touched files + production build | Pass |

### Phase 26b — Ticket Slot Id + live Device history

```text
Ticket list/detail → Slot Id (API deviceId) → /devices/{id}
Device history → GET /api/devices/:id → same layout, data by route id
```

| Criterion | Result |
|-----------|--------|
| Ticket list column labeled Slot Id | Pass |
| Ticket detail shows Slot Id link (not Device PD label) | Pass |
| Device history loads live for route param; changes with id | Pass |
| Legacy PD-xxxx / missing slot_id still resolvable via API | Pass |
| Lint on touched files | Pass |

### Phase 27 — QR scan → device → raise / update

```text
QR / typed / sticker → resolveScan
  → qr_token → POST /api/devices/slot-mac
  → else → GET /api/devices/scan?q=
  → openTicketId? → Update / Detail
  → else → Raise form → POST /api/tickets
```

| Criterion | Result |
|-----------|--------|
| Live `resolveScan`: sticker → `/slot-mac`; legacy → `/scan` | Pass |
| Device facts show QR / Slot Id / Slot Label / Slot Identifier / Parking Location | Pass |
| No open ticket → Raise create via `POST /api/tickets` | Pass |
| Open ticket → no second create; Update → `/tickets/:id` (later → `/tickets/update`) | Pass |
| `409 OPEN_TICKET_EXISTS` guides to existing ticket | Pass |
| Scan API failure does not assume free device | Pass |
| No SmartPark calls from the browser | Pass |
| No new QR library; existing `QrScannerModal` reused | Pass |
| Lint + production build | Pass |

### Phase 27b — Update Ticket live scan

```text
/tickets/update → resolveScan → openTicketId? → Detail : Raise CTA
```

| Criterion | Result |
|-----------|--------|
| Live `resolveScan` on Update Ticket (no mock TK-1042 form) | Pass |
| Open ticket → Update/Open → `/tickets/:id` | Pass |
| Free device → Raise CTA | Pass |
| Miss / API error EmptyState | Pass |
| Lint + production build | Pass |

### Phase 28 — QR lookup → Update Ticket

```text
Raise/Update QR → openTicketId? → Update Ticket (/tickets/update) → getTicket assignee gate → Detail openUpdate
```

| Criterion | Result |
|-----------|--------|
| Raise/Update support typed QR Number + existing camera scanner | Pass |
| Lookup reuses `resolveScan` (slot-mac / scan); no duplicate scanner/API | Pass |
| Raise: no open ticket → existing create flow unchanged | Pass |
| Raise: open ticket → no second create; primary **Update Ticket** → `/tickets/update` with `ticketId` | Pass |
| Update: open + assigned to me → ready for update handoff | Pass |
| Update: closed / not assigned / missing → toast; form not opened | Pass |
| One open ticket per Slot Id respected in UI; backend still authoritative | Pass |
| Detail Add Update for ops or current assignee | Pass |
| Lint + production build | Pass |

### Phase 29 — Update form on `/tickets/update`

```text
Update Ticket → /tickets/update?ticketId= → assignee gate → TicketAddUpdateForm on page
```

| Criterion | Result |
|-----------|--------|
| Update Ticket does not navigate to `/tickets/<id>` for the update action | Pass |
| Update Ticket navigates to `/tickets/update` with `ticketId` | Pass |
| Form shown directly on Update page after gate (no second click) | Pass |
| Shared `TicketAddUpdateForm` reused (Detail Modal + Update page) | Pass |
| Raise / Scan QR / Detail field CTAs use Update URL | Pass |
| Detail trail / Open {id} unchanged | Pass |
| Refresh with `?ticketId=` reloads when assignee | Pass |
| Lint + production build | Pass |

### Phase 30 — Work Report API

```text
Work report → GET /api/reports/work → people UI; Export → /work/export CSV
```

| Criterion | Result |
|-----------|--------|
| Mock `REPORT` / `data/workReport.js` removed | Pass |
| Loads from `GET /api/reports/work` with view / person / road | Pass |
| From/To sent only for Date range view | Pass |
| Person from technicians lookup; Road from road lookups | Pass |
| Export downloads CSV via `/api/reports/work/export` | Pass |
| Page gated with Work report `v` | Pass |
| Loading / empty / error states wired | Pass |
| Layout unchanged (team strip + person panels) | Pass |
| Lint + production build | Pass |

### Phase 31 — Ticket Detail assign / reassign

```text
Assign / Reassign → Hand to (technicians UUID) + note → POST /api/tickets/:id/assign → reload trail
```

| Criterion | Result |
|-----------|--------|
| `assignTicket` service wired | Pass |
| Hand to from `GET /api/lookups/technicians` (not TEAM) | Pass |
| Optional note sent as `reason` | Pass |
| Validation when no worker selected | Pass |
| Success reloads assignee + assignment trail | Pass |
| Cancel does not call API | Pass |
| Empty trail shows `No assignment history.` | Pass |
| UI gated with All tickets `a` | Pass |
| Layout unchanged | Pass |

### Phase 32 — Master delete + image zoom/crop

```text
Parts → confirm → PATCH active:false
Issues → live GET → Delete unused / Deactivate used (d) → refresh
ImagePreview → hover pointer zoom + pinch/pan
Camera crop → dvh stage + sticky actions + larger handles
```

| Criterion | Result |
|-----------|--------|
| Part deactivate confirm Modal + busy state | Pass |
| Part deactivate gated Issue `e` or Technician | Pass |
| IssueMaster loads `GET /api/issues` | Pass |
| Sub Delete / Deactivate via Issue master `d` | Pass |
| 409 IN_USE → deactivate instead | Pass |
| Image hover/pinch zoom without new libs | Pass |
| Crop sticky actions + mobile handles | Pass |
| Lint | Pass |

### Phase 34 — Issue Master create + category hard delete

```text
IssueMaster → POST /categories | POST /subcategories (c)
           → DELETE /categories/:id (d) → 409 IN_USE → PATCH active:false (e)
```

| Criterion | Result |
|-----------|--------|
| Create category via `POST /api/issues/categories` | Pass |
| Create subcategory via `POST /api/issues/subcategories` | Pass |
| Validation (min 2 chars) + busy + toastApi | Pass |
| Category hard delete gated Issue master `d` | Pass |
| 409 IN_USE → deactivate when `e`; else error toast | Pass |
| Sub delete/edit unchanged; list refresh without full reload | Pass |
| Raise Ticket still uses live `listIssueCategories` (cache cleared) | Pass |

### Phase 35 — Users role hierarchy UI

```text
Users c/e → listRoles → filterAssignableRoles(actor.role)
  → create/edit <select> same-or-below only
  → edit PATCH omits roleId when unchanged
```

| Criterion | Result |
|-----------|--------|
| Hierarchy mirrors backend (Admin → … → AMC officer) | Pass |
| Create role dropdown same-or-below only | Pass |
| Edit role dropdown same filter + keep current if higher | Pass |
| Same-role option available | Pass |
| Higher roles hidden (e.g. PM never sees Admin) | Pass |
| Edit omits unchanged `roleId` | Pass |
| Users `c`/`e` gates preserved; Roles matrix unchanged | Pass |
| Backend 403 still shown via toastApiError | Pass |

### Phase 36 — Live Roles matrix + route permission guards

```text
Roles v → GET /api/roles → matrix checkboxes (local permMap)
Roles e → PATCH /api/roles/:id/permissions → refresh roles (+ /me if own role)
RequireAuth → RequirePerm(screen, flag) → page
canPerm → action visibility (Raise c, Update e, Close x, …)
```

| Criterion | Result |
|-----------|--------|
| Checkbox toggle updates immediately (controlled state) | Pass |
| Save persists via PATCH; create role via POST | Pass |
| Roles `v`/`c`/`e` gate tab / create / edit matrix | Pass |
| PM cannot save matrix without Roles `e` | Pass |
| `RequirePerm` blocks direct URL without screen flag | Pass |
| Raise/Update/Close/Scan/Road Add action gates | Pass |
| Phase 35 hierarchy dropdown unchanged | Pass |
| Backend remains authoritative (401/403 toasts) | Pass |

### Phase 46 — Role delete, Inactive exemption, and user hard delete

```text
Roles d → danger Delete button (Action cell) → confirm Modal
       → deleteRole(id) → DELETE /api/roles/:id
       → 200: toastApiSuccess + refreshRoles()
       → 409 ROLE_IN_USE: toastApiError → backend message, role stays in the list

GET /api/users → role: null + roleMissing: true  → "No role — select one"
Edit user → status Active without a role          → prompt, backend 409 ROLE_REQUIRED

Users d → Delete on every row → confirm Modal → deleteUser(id) → DELETE /api/users/:id
       → 200: toastApiSuccess + refreshUsers()   (row gone; past tickets lose the name)
```

| Criterion | Result |
|-----------|--------|
| Unassigned role is deleted and leaves the roles table | Pass |
| Role held by an Active or Pending account is rejected and stays in the list | Pass |
| Toast shows "Role is assigned to users. Please change their role before deleting it." | Pass (backend `error` text, no generic fallback) |
| Inactive accounts do not block a role delete | Pass |
| Account left without a role still appears in the Users table | Pass (LEFT JOIN + `roleMissing`) |
| Reactivating a role-less account is refused until a role is chosen | Pass (client prompt + backend `409 ROLE_REQUIRED`) |
| No client-side `row.users` pre-check that could drift from the backend | Pass |
| Roles `d` gate preserved; no other role gains Delete | Pass |
| User delete removes the account permanently and works on Inactive rows too | Pass |
| Self-delete and last-Active-Admin guards unchanged | Pass |

### Phase 47 — Field roles raise, optional assign, auto-assign on update, Resolve, Close with update

```text
Raise (Raise ticket c: Technician / Engineer / Electrician / …)
  → Assign to (All tickets a only, optional, default Assign later)
  → POST /api/tickets { …, assigneeId? }        non-assigner + assigneeId → 403

Add update / Resolve (Detail modal) or QR /tickets/update
  → TicketAddUpdateForm (Close Ticket: ( ) Yes (•) No)
  → POST /api/tickets/:id/updates { …, closeTicket?: true, handoverToUserId? }
      assigned ticket      → assignee unchanged
      unassigned + field   → auto-assigned to the updater (backend, row-locked)
      unassigned + Admin/PM → required Assign to → handoverToUserId
      closeTicket: true    → update + close in one transaction
  → upload photos → PATCH …/updates/:eventId/photos → reload ticket
```

| Criterion | Result |
|-----------|--------|
| A/B/C Technician, Engineer, Electrician can raise (`Raise ticket` `c`, no role hardcode) | Pass (backend smoke) |
| D Raise without an assignee → created, unassigned | Pass |
| E Raise with an assignee (assigners only) → existing assignment behavior | Pass; field role + `assigneeId` → `403` |
| F Scan an open ticket → Update Ticket form opens (unassigned allowed for field roles) | Pass |
| G Assigned ticket keeps its assignee on update | Pass |
| H Unassigned ticket → logged-in field user becomes the assignee (user id, trail row) | Pass |
| I Add Update opens with Close Ticket = No | Pass |
| J Close Ticket = No → update saved, ticket stays open | Pass |
| K Close Ticket = Yes → update saved and ticket closed in one request | Pass |
| L Resolve → same Add Update modal (`Site visit — resolved`, Close = No) | Pass |
| M Existing Visited by / issue / parts / labour / photo validation and toasts | Pass (unchanged code paths) |
| No new components / routes / API clients; `/tickets/close` unchanged | Pass |

### Phase 37 — Multi-issue tickets + Site attendant Sync / Issue Master

```text
Raise/Update → issues[{ categoryId, subCategoryId }, …]
Detail → issuesReported / issuesFound (+ classification fallback)
Site attendant → Device list c (Sync) + Issue master vce..d via /me + canPerm
```

| Criterion | Result |
|-----------|--------|
| Raise multi-row issues → `POST /api/tickets` `issues[]` | Pass |
| Client duplicate sub toast; incomplete row blocked | Pass |
| Add Update live categories + full `issues[]` on submit | Pass |
| Detail lists reported/found arrays | Pass |
| Site attendant ROLES preview matches BE seed | Pass |
| Sync / Issue Master reuse existing `canPerm` UI | Pass |
| No new Sync or Issue Master page | Pass |

### Phase 38 — Raise create → upload → attach photos

```text
Raise → POST /api/tickets (photos []) → uploadImages → PATCH …/raised/:eventId/photos
```

| Criterion | Result |
|-----------|--------|
| Create returns `eventId` for raised event | Pass |
| Photos upload only after create succeeds | Pass |
| `attachTicketRaisePhotos` patches raised event | Pass |
| Photo fail after create still opens the new ticket | Pass |
| Raise without photos still succeeds | Pass |
| Same network order pattern as Add Update | Pass |

### Phase 39 — Roles hierarchy + route holes

```text
Roles e + canManageRolePermissions(actor, target)
  → Save / checkboxes enabled only for same-or-below
RequirePerm Dashboard v → /dashboard
RequirePerm Update ticket v → /masters/parts
PartMaster: Technician | Engineer field-staff create/update
```

| Criterion | Result |
|-----------|--------|
| Higher-role matrix is view-only even with Roles `e` | Pass |
| `/dashboard` and `/masters/parts` use `RequirePerm` | Pass |
| Parts nav gated by Update ticket `v` | Pass |
| Engineer create/update Parts matches Technician | Pass |

### Phase 33 FE — SmartPark sticker `qr_token`

```text
Camera/typed → extractQrToken?
  → yes → POST /api/devices/slot-mac { qrToken }
  → no  → GET /api/devices/scan?q=
```

| Criterion | Result |
|-----------|--------|
| `extractQrToken` + `resolveScan` wired (no page UI change) | Pass |
| Sticker / `?qr_token=` → POST `/api/devices/slot-mac` | Pass |
| Legacy PD/QR/slot → GET `/api/devices/scan` | Pass |
| 404 → miss UX (null); other errors rethrown | Pass |
| No SmartPark host calls from the browser | Pass |
| Raise/Update still branch on `openTicketId` | Pass |

### Device list status tiles → filter

| Criterion | Result |
|-----------|--------|
| Working / Under repair / Not working tiles set `applied.status` + page 1; URL stays `/devices` | Pass |
| Total devices → status `All` (no status filter) | Pass |
| Status select + Apply / Reset unchanged | Pass |
| Do not navigate Under repair / Not working to `/tickets` | Pass |
| Lint + production build | Pass |

### Device Sync result stats (frontend)

| Criterion | Result |
|-----------|--------|
| Complete toast shows Created / Updated / Skipped from `devicesCreated` / `devicesUpdated` / `devicesSkipped` when present | Pass |
| Incomplete/skip/MAC upsert rules stay on backend; FE refreshes list only | Pass |
| Non-blocking sync, 409 handling, page/filters preserved | Pass |
| Lint + production build | Pass |

### Phase 39 — New-ticket notifications

```text
POST /api/tickets
  → backend persists ticket.raised notifications
  → VAPID Web Push → public/sw.js → notification bell + shared unread badges
  → page plays public/sounds/elevenlabs-achievement-unlock.mp3 for a new event, including an open background tab
  → service worker shows a non-silent, interaction-required Chrome notification
  → click → existing /tickets/:ticketId route
```

| Criterion | Result |
|-----------|--------|
| Existing backend notification API consumed without a second notification domain | Pass — `src/services/notifications.js` |
| Admin / Project manager / Control room with All tickets `v` see the notification UX | Pass — `canReceiveTicketNotifications` |
| Browser permission requested only from explicit Enable action | Pass |
| granted / default / denied / unsupported / unavailable states shown | Pass |
| Existing subscription reconciled through push-config + push-subscriptions APIs | Pass |
| Push click uses backend data and existing ticket route | Pass |
| Notification ID marked read through backend API | Pass |
| Supplied achievement MP3 plays on new push/count increase, including an open background tab; duplicate events are debounced and autoplay rejection is harmless | Pass |
| Service-worker Chrome notification is non-silent and remains interaction-required until dismissed/clicked | Pass |
| One shared unread count drives bell, Tickets parent, and All tickets child | Pass |
| Sidebar collapse, drawer, labels, group behavior preserved | Pass |
| Service worker handles push/click only; protected API calls stay in page | Pass |
| No WebSocket, Socket.IO, SSE, duplicate service worker, or new library | Pass |
| `npm run build` | Pass |
| Full `npm run lint` | Pass |

### Phase 40 — View Update issue details

| Criterion | Result |
|-----------|--------|
| View Update shows Reported issues / Issues found context when issue data exists | Pass |
| View Update hides the issue section when no issue is recorded | Pass |
| Multiple categories render as separate grouped cards | Pass |
| Every sub-category renders beneath its category | Pass |
| Category/sub-category counts are visible | Pass |
| Legacy scalar category/sub-category fallback remains | Pass |
| Photos remain in View Image, not View Update | Pass |
| Browser smoke test with 2 categories / 3 sub-categories | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 41 — Update issue/parts clarity

| Criterion | Result |
|-----------|--------|
| Update issue selection starts blank; user chooses category and sub-category | Pass |
| Existing reported/found issues are not auto-filled into the update form | Pass |
| One Parts were changed radio with a single Yes option controls whether parts were changed | Pass |
| Parts use a searchable dropdown after Yes; multiple parts can be selected | Pass |
| Selected parts tags render after the dropdown; cost summary renders after Labour / other charges | Pass |
| Summary shows Parts Total, optional Labour / other charges, and Total Amount | Pass |
| Labour input rejects negative values | Pass |
| Labour / other charges appear after Parts were changed and only when Yes is selected | Pass |
| No selection sends existing `parts: []` and `cost: 0`; no new request field | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 42 — Update-only ticket count

| Criterion | Result |
|-----------|--------|
| Updates count includes only Update Ticket flow event types | Pass |
| `reclassified` events are included | Pass |
| Raised, assigned, and closed events are excluded | Pass |
| Count is independent of technician, engineer, admin, project manager, or control room role | Pass |
| Backend TypeScript build | Pass |


### Phase 44 — Slot Label ascending order + Assign dropdown role filter

| Criterion | Result |
|-----------|--------|
| Device list rows are ordered by Slot Label ascending | Pass (backend SQL) |
| Order is correct across pages 1 → 2 (server `LIMIT`/`OFFSET`) | Pass |
| No client-side sorting added to `DeviceList.jsx` | Pass |
| Search, road / status / repeat-fault filters, and status tiles unchanged | Pass |
| Pagination envelope and `TablePagination` behavior unchanged | Pass |
| Ticket list order unchanged (`raised_at DESC`) | Pass |
| Assign / Reassign "Hand to" lists Technician users | Pass |
| Assign / Reassign "Hand to" lists Engineer users | Pass |
| Admin, Project manager, Control room, Site attendant are hidden | Pass |
| Role values come from the API response via `ASSIGNABLE_ASSIGNEE_ROLES`, not hardcoded labels | Pass |
| No second users API and no duplicate fetch (reuses `listTechnicianLookups`) | Pass |
| Existing assignee still displays and can be reassigned (current assignee pinned) | Pass |
| Work report Person filter unchanged (CR / PM still listed) | Pass |
| No user deleted, no role changed, global Users list untouched | Pass |
| Backend `assertEligibleAssignee` unchanged — still the final source of truth | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 49 — Per-issue Open/Resolved

| Criterion | Result |
|-----------|--------|
| Add Update lists only Open reported issues as resolvable chips | Pass |
| Multiple issues can be resolved in one update (`resolveIssueIds`) | Pass |
| Resolved issues do not reappear on the next update (Detail, `/tickets/update`, QR) | Pass |
| Same form / POST for Admin, PM, Control room (with `Update ticket` `e`) and field roles | Pass |
| Single-issue ticket resolves through the same chips | Pass |
| `409 ISSUE_ALREADY_RESOLVED` → toast + reload | Pass |
| Last issue resolved keeps the ticket open; Close Ticket default still No | Pass |
| Closing (update Yes or Close page) resolves remaining issues; Close page shows hint | Pass |
| Detail shows Open / Resolved per reported issue; View Update shows resolved issues | Pass |
| Dashboard "Why devices are down" counts open issues; subtitle shows open issues / open tickets | Pass |
| Found-on-site issue rows, parts/cost, photos, visited by, assignee pick unchanged | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 50 — Several open tickets per device

```text
Raise → resolveScan → openTickets? → list each ticket + open issues (Update Ticket / Open); form stays available
      → submit → same Open issue? → all on one ticket: Update Ticket ; else toast names : createTicket
QR Update → resolveScan → 1 open ticket: auto-open ; >1: pick list + "Raise a ticket for a different issue" ; 0: Raise
```

| Criterion | Result |
|-----------|--------|
| Raise is not blocked by an open ticket on the device; a different issue raises a new ticket | Pass |
| Raise lists every open ticket with its Open issues (Update Ticket / Open) | Pass |
| Selecting an issue already Open on one ticket → toast + Update Ticket for that ticket | Pass |
| Mixed / multi-ticket duplicates → toast naming them, nothing submitted | Pass |
| `409 OPEN_TICKET_EXISTS` handled from `details.issues`; scan refreshed, form kept | Pass |
| `REOPEN_SAME_TICKET` handler removed (backend no longer sends it) | Pass |
| QR Update: one open ticket auto-opens (unchanged); several → pick list with open issues | Pass |
| QR Update offers "Raise a ticket for a different issue" with the QR prefilled | Pass |
| DeviceCard "Open tickets" fact lists every open ticket | Pass |
| Assignee gate, Add Update form, Resolve issues chips unchanged | Pass |
| Dashboard / Device list / Device detail render backend values unchanged (device counted once, worst status) | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 51 — Main/Sub issue resolution and removal of ticket assignment

Supersedes the assignment criteria of Phases 31, 44 and 47 above (kept as history).

```text
Add Update → Resolve Issues
  Issue 1 · {Main issue}  [collapsed]          → open → ☐ Main issue (resolves all open subs) + sub chips
  [Another Issue]                              → reveals Issue 2 … (hidden when all shown)
  [Add another issue]  (after a panel opened)  → TicketIssueRows → new Open issues
  → POST updates { resolveCategoryIds, resolveIssueIds, addIssues, closeTicket? }
```

| Criterion | Result |
|-----------|--------|
| Resolve Issues shows only the ticket's raised issues, grouped by Main Issue with its Sub Issues | Pass |
| Panels start collapsed; only Issue 1 listed | Pass |
| **Another Issue** reveals the next existing Main Issue one at a time and disappears after the last | Pass |
| **Add another issue** hidden until a panel is opened; adds new issues as Open, after the raised ones | Pass |
| Ticking a Main Issue resolves all its Open sub issues (`resolveCategoryIds`); a Sub Issue resolves only itself (`resolveIssueIds`) | Pass |
| Resolved sub issues and fully resolved Main Issues are shown disabled | Pass |
| Same panel on Detail Add update / Resolve, `/tickets/update` and QR for Admin, PM, Control room (with `e`) and field roles | Pass |
| `409 ISSUE_ALREADY_RESOLVED` / `ISSUE_ALREADY_ON_TICKET` / `OPEN_TICKET_EXISTS` → toast + reload; `400 INVALID_ISSUES` → toast | Pass |
| Resolving every issue does not close the ticket; Close Ticket stays an explicit Yes | Pass |
| No Assign / Reassign anywhere (Detail, All Tickets, Raise); no "Assigned to" fact or column; no assignee filter | Pass |
| All Tickets tabs are Open (every non-closed ticket) and Closed | Pass |
| Any user with Update ticket `e` sees Add update on any open ticket; QR Update has no assignee gate | Pass |
| No request to `/api/tickets/:id/assign` | Pass |
| Historical `assigned` events still render in work history | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 52 — Under Repair tab, clickable cards, tab transition

Supersedes the Phase 51 Open / Closed tab criterion above.

```text
All tickets
  [Open, not attended] [Under repair] [Waiting for spare] [Open over 3 days]   ← cards are buttons
  Open (no update yet) │ Under Repair (≥1 update) │ Closed                    ← ink bar slides
  Panel slides in from the side of the selected tab
```

| Criterion | Result |
|-----------|--------|
| Tabs Open → Under Repair → Closed with backend counts | Pass |
| Open lists only raised tickets with no update; Under Repair lists tickets with at least one update, Waiting for spare included with its own pill | Pass |
| Status select only on Under Repair (All under repair / Under repair / Waiting for spare) | Pass |
| Open, not attended card → Open tab | Pass |
| Under repair / Waiting for spare cards → Under Repair tab with that status | Pass |
| Open over 3 days card → `age=over3`; Open tab if it has any, else Under Repair; badges show the split | Pass |
| Selected card highlighted (`aria-pressed`, `.tile-selected`); card numbers stay the same | Pass |
| Closed tab clears the age filter | Pass |
| Underline slides between tabs; panel slides left / right by direction; no old rows flash | Pass |
| `prefers-reduced-motion` disables both animations | Pass (CSS) |
| Legacy `?tab=asg` → Under Repair; anything unknown → Open | Pass |
| `npm run lint` / `npm run build` | Pass |

### Phase 53 — Slot View

Slot-centric view of existing tickets (backend Phase 53). Gate: own permission screen **Slot View** `v` — Admin and Project manager by default, managed per role in Roles & permissions.

```text
Sidebar: Dashboard → Slot View → Tickets ▸ …
/slot-view            Slot Id │ Slot Label │ Road │ Tickets   (only slots with tickets)
/slot-view/:slotId    Unresolved issues (Open only, one per Sub Issue, grouped by Main Issue)
                      Tickets (every ticket for the slot, Closed included)
```

| Criterion | Result |
|-----------|--------|
| Sidebar shows Slot View immediately after Dashboard, with icon, active highlight, collapsed rail and mobile drawer | Pass |
| `/slot-view` lists only slots with at least one ticket (Slot Id, Slot Label, Road, Tickets) | Pass |
| Ticket count counts tickets, not issues (3-issue ticket = 1) | Pass (backend smoke) |
| Natural Slot Label ascending order from the server; no client sort | Pass |
| Search + server pagination (`TablePagination` 10/25/50/100) | Pass |
| Slot Id and Slot Label both open the same `/slot-view/:slotId` | Pass |
| Unresolved issues show only Open Sub Issues, unique per Sub Issue, grouped by Main Issue, with ticket links | Pass |
| Resolved Sub Issue hidden while an Open sibling keeps its Main Issue visible | Pass (backend smoke) |
| Tickets section lists every ticket for the slot, Closed included, via the shared `TicketTable` | Pass |
| Clicking a ticket opens the existing Ticket Detail; back link returns to the slot | Pass |
| Empty states: no ticketed slots, no unresolved issues, no tickets | Pass (backend smoke returns empty sections; not seen in the browser because the local DB always has tickets) |
| Unknown slot → "Slot not found."; 403 → "You do not have access to this slot."; backend 401 / 403 enforced | Pass |
| Desktop / 820px / 390px readable, no page overflow, ticket count visible | Pass |
| All tickets table unchanged after the `TicketTable` extraction | Pass |
| Slot View hidden for roles without the `Slot View` screen (Technician: no sidebar item, `/slot-view` redirects to `/tickets`) | Pass |
| Roles & permissions matrix has a Slot View row after Dashboard (Project manager View ticked, Technician empty); backend grant / revoke flips access | Pass (browser + backend smoke) |
| Slot detail without `All tickets` `v`: Tickets panel shows "Ticket list not available", issue ticket ids are plain text | Pass (backend smoke covers the 403 on `?device=`; UI path not exercised in the browser) |
| `npm run lint` / `npm run build` | Pass |
