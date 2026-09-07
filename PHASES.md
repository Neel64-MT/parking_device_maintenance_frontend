# PHASES.md — Implementation Phases

Phases are ordered by dependency. **Do not start Phase 1 until planning is approved.**

---

## Phase 0: Existing project analysis — COMPLETE (planning)

**Objective:** Understand original + scope; document architecture.

**Done when:** PR, ARCHITECTURE, RULES, DESIGN, MEMORY, PHASES, SKILLS exist and inventory is accurate.

**Verification:** Docs reviewed; original path untouched.

---

## Phase 1: React project foundation

**Objective:** Turn the Vite starter into an app shell that matches original chrome.

**Involves:** `package.json`, Tailwind setup, `src/index.css`, `src/config/nav.js`, `layouts/AppLayout.jsx`, `Sidebar`, `Topbar`, `routes`, toast.

**Dependencies:** None (first implementation phase).

**Tasks:**

1. Add Tailwind; map design tokens from DESIGN.md into theme / CSS variables.
2. Add `react-router-dom`; define routes for all 15 screens (pages can be placeholders).
3. Port `APP`, `MENU`, `ICON` from `nav.js`.
4. Implement sidebar (groups, active/`match`, mobile drawer ≤820px).
5. Implement topbar (title, crumb HTML/text, actions slot, user chip).
6. Remove Vite demo `App.css` chrome.
7. Port Archivo font import.
8. Port toast behavior (2.6s show).

**Verification:** Navigate routes; sidebar highlight; mobile menu; toast callable.

**Completion:** Shell visually matches original empty page chrome on desktop and ≤820px.

---

## Phase 2: Shared UI primitives + data modules

**Objective:** Extract reusable bits and master data without building every page.

**Files:** `components/ui/*`, `data/issueMaster.js`, `partMaster.js`, `team.js`, helpers (`IssueSelects`, `PhotoPicker`, `bindTableSearch` → hook).

**Tasks:** Button variants, Panel, Pill, JumpLinks, FilterBar, Tabs, Views, EmptyState, DeviceCard, PhotoPicker, IssueSelects, severity pills.

**Verification:** Story-less visual check on a scratch route or early Dashboard draft.

**Completion:** Primitives match CSS sections; ISSUE_MASTER identical to `app.js`.

---

## Phase 3: Dashboard

**Objective:** Full dashboard parity.

**Page:** `pages/Dashboard.jsx` ← `dashboard.html`

**Tasks:** Jump links, fleet strip, ranked fault list, road-wise table, open tickets table, topbar road/date filters.

**Verification:** Side-by-side with `dashboard.html`; all links resolve to React routes.

**Completion:** Visual + link parity.

---

## Phase 4: Tickets domain

**Order (dependencies):**

1. **TicketList** — tabs, tiles, filters, search, table (`setTab`)
2. **TicketDetail** — record, timelines, inline forms, reclass strip
3. **TicketRaise** — mobile flow, slots, dup warn, sticky bar
4. **TicketUpdate** — fork fixed/open, chips, reclass watch
5. **TicketClose** — cost table, chips, sticky bar
6. **WorkReport** — REPORT dataset, setView, person panels

**Verification:** Each page vs original HTML; raise→update→close navigation; Open tab Assign buttons; report Day/Week/Month.

**Completion:** Full ticket flow clickable with preview toasts.

---

## Phase 5: Devices domain

1. **DeviceList** — tiles, filters, search, table
2. **DeviceDetail** — split table, parts, history timeline
3. **DeviceAdd** — forms + actions
4. **ScanQr** — simulate/manual find, result/notfound

**Verification:** History links; scan hit/miss; add-device cancel/save toasts.

**Completion:** Device flows match original.

---

## Phase 6: Masters

1. **IssueMaster** — pick list, USAGE counts, deactivate/delete toasts, search
2. **RoadList** — filters, search, table
3. **RoadAdd** — multi-panel form

**Verification:** Category switch re-renders subs; road search filters rows.

**Completion:** Masters parity.

---

## Phase 7: Users & roles

**Page:** `Users.jsx` ← `users.html`

**Tasks:** Tiles, Users/Roles tabs (Users first), inline user form, role help, permission matrix `showRole`, search.

**Verification:** Matrix checkboxes match ROLES encoding; tab switch; toasts.

**Completion:** Users screen parity.

---

## Phase 8: Responsive & interaction polish

**Objective:** Match breakpoints and micro-interactions.

**Tasks:** Audit ≤820 / 760 / 900 / 940 / 1080; sticky bars; topbar-actions hide; reduced-motion; focus-visible; hover states.

**Verification:** Resize checklist per DESIGN.md; field pages usable at phone width.

**Completion:** Responsive parity signed off.

---

## Phase 9: Final QA

**Objective:** Functionality + visual parity checklist complete.

**Tasks:** Walk every route; every toast; every tab; forms prevent submit; no dead links; docs updated; lint clean.

**Verification:** Checklist in MEMORY + PR success criteria.

**Completion:** Migration approved for use as React design preview; original still unmodified.

**Status:** Phase 9 signed off — see MEMORY.md Final QA checklist and PR.md success criteria.

---

## Phase 10: Auth (login / signup)

**Objective:** Wire real session against the sibling backend (`../backend`, port 5000).

**Status:** Complete

**Tasks:**

1. Vite proxy `/api` → `http://localhost:5000`.
2. `src/services/api.js` + `auth.js` (Bearer JWT in `localStorage`).
3. `AuthContext` with `RequireAuth` / `GuestOnly`.
4. `/login` — email or mobile + password → `POST /api/auth/login`.
5. `/signup` — informational only (Admin creates users).
6. Topbar shows session user + Log out → `POST /api/auth/logout`.

**Verification:** Login with seed `9825012345` or `alkesh.patel@pdm.local` / `Password123`; unauthenticated routes redirect to login; logout clears session.

**Completion:** Auth wall active; most domain screens still mock data until later API wiring.

---

## Phase 11: Signup approval, forgot password, admin password

**Objective:** Self-signup with admin approval; wire forgot/reset UI; admin change password on Users.

**Backend:** `../backend` — migration `005_user_pending_status.sql`, `POST /api/auth/signup`, login `PENDING_APPROVAL`, users `?status=` filter (reuse PATCH for approve/password).

**Frontend:** Signup form; `/forgot-password`, `/reset-password`; Login link; Users API list + Approve + Change password.

**Verification:** Signup → pending login blocked → admin approve → login; forgot → reset → login; admin PATCH password; existing Active users still work.

**Completion:** Flows in PR.md Phase 11 criteria pass.

---

## Phase 12: Sidebar Settings + desktop collapse

**Objective:** Settings bottom utility + route; desktop expand/collapse with smooth animation; preserve mobile drawer.

**Status:** Complete (page content filled in Phase 13)

**Tasks:**

1. Analyze existing Sidebar / AppLayout / NavIcons / CSS rail.
2. Add `SETTINGS` + `/settings`; wire bottom section.
3. Desktop `railCollapsed` + `html.rail-narrow` + CSS width tokens.
4. Smooth label/width transitions; collapsed `title` tooltips; group click expands rail.
5. Responsive check ≤820 vs ≥821; docs finalize.

**Verification:** Expanded/collapsed visuals; Settings navigates; MENU + mobile drawer unchanged; lint/build.

**Completion:** PR.md Phase 12 criteria pass.

---

## Phase 13: Settings account + shell / dashboard UX

**Objective:** Self-service Settings (profile + password); logout confirm; shell full-width; dashboard polish.

**Status:** Complete

**Backend (`../backend`):**

1. `PATCH /api/auth/me` — `{ fullName, email, mobile }` for the signed-in user.
2. `POST /api/auth/change-password` — `{ currentPassword, newPassword }`; deny old JWT; return new `{ token, user }`.

**Frontend:**

1. `Settings.jsx` — Profile + Password panels; wire `AuthContext.updateProfile` / `changePassword`.
2. Topbar logout icon (`NavIcons.logout`) + Modal confirmation before logout.
3. Remove Dashboard open-tickets panel; fleet legend tips via `Tooltip`; equal 4-column legend.
4. Shell width `calc(100% - var(--rail))`; drop `.page` `1360px` max.
5. `.foot-note { margin-top: auto }` for bottom-aligned panel footnotes in grids.
6. Landing filters already relocated to page body (document in MEMORY).

**Verification:** Save profile → topbar name/initials update; change password → stay signed in; logout confirm cancel vs confirm; sidebar open/collapsed content fills right edge; docs updated.

**Completion:** PR.md Phase 13 criteria pass.

---

## Phase 14: Raise ticket flow + field action bars

**Objective:** Simplify Raise ticket; keep PhotoPicker compact; put Cancel/primary actions in page flow (not fixed).

**Status:** Complete

**Frontend:**

1. `TicketRaise.jsx` — drop step 3 assign/priority; reported-by from `useAuth()`; wrap actions in `.sticky-bar-inner`.
2. `TicketUpdate.jsx` / `TicketClose.jsx` — same `.sticky-bar-inner` pattern.
3. `index.css` — `.sticky-bar { position: static; background: transparent }`; inner `max-width: 580px`; reduce `.mobile` bottom padding (was for fixed bar).
4. `PhotoPicker` — remain original 86×86 dashed tile (full-width experiment reverted).

**Verification:** Raise shows two steps only; reported-by matches session; actions scroll with form and align to form width; Add photo is compact tile; docs updated.

**Completion:** PR.md Phase 14 criteria pass.

---

## Phase 15: Ticket visibility + PM signup approval

**Objective:** Enforce role-based ticket visibility; ensure Project Manager can approve/update signups like Admin.

**Backend (mostly shipped; finish gaps):**

1. `lib/ticket-access.ts` — already on list/export/detail/updates/close.
2. Assign: road access only (Control room).
3. Dashboard: `appendTicketVisibilitySql` on ticket-backed queries.
4. PM Users `vce...` + migration `006` (already in backend).

**Frontend:** Mirror ROLES PM Users; copy Admin/PM approval.

**Verification:** Smoke visibility + PM approve + Control-room assign; dashboard scoped for tech.

**Completion:** PR.md Phase 15 criteria pass.

---

## Phase 16: Frontend role-scoped ticket rendering

**Objective:** Wire TicketList, Dashboard, and TicketDetail to backend-scoped APIs without client-side security filtering.

**Tasks:**

1. `services/tickets.js` + `services/dashboard.js` (+ envelope helper if list returns sibling tiles).
2. TicketList → `GET /api/tickets`.
3. Dashboard → `GET /api/dashboard`.
4. TicketDetail → `GET /api/tickets/:id` with 403 UI.
5. Docs finalize.

**Out of scope:** Raise/Update/Close/WorkReport/DeviceDetail mocks; Work report ownership on backend.

**Verification:** Lint; Admin/PM see broad data; technician scoped; foreign detail id errors.

**Completion:** PR.md Phase 16 criteria pass.

---

## Phase 17: QR scan + role routing

**Objective:** Camera QR for Site attendant / Technician; mock device resolve; one open ticket per device; Technician Update flow unchanged after scan.

**Tasks:**

1. `scanDevice` mock + `services/devices.resolveScan`.
2. `QrScannerModal` + `html5-qrcode`.
3. TicketRaise / TicketUpdate / ScanQr wiring + role gate.
4. Align backend `GET /api/devices/scan` structured fields + lat/lng.
5. Docs finalize.

**Out of scope:** Live raise POST; final QR string format; external `PROJECT_PATH` inspection package.

**Verification:** Lint/build; Site attendant blocked on open device; Technician scan → same Update mock.

**Completion:** PR.md Phase 17 criteria pass.

---

## Phase 18: Home by role, Open status, Raised by, raiser visibility

**Objective:** Admin/PM open Dashboard after login; ticket status is Open (not New); show Raised by on the list; raisers see their tickets even outside assigned roads.

**Status:** Complete

**Frontend:**

1. `homePathForUser` / `isDashboardRole` in `services/users.js`; Login, GuestOnly, `HomeRedirect`, Users unauthorized redirect.
2. Dashboard page redirects non–Admin/PM; Sidebar hides Dashboard without ops-lead role.
3. Ticket status normalize `New` → `Open`; Open tab label; mock data + list column **Raised by**.
4. Docs finalize.

**Backend (`../backend`):**

1. List/export: drop `assigned_roads` AND that hid raiser rows; keep `appendTicketVisibilitySql`.
2. `assertTicketAccess`: raiser/assignee before road check.
3. List returns `raisedBy`; displayStatus maps legacy `New` → `Open`.
4. Smoke: Site attendant sees TK-1099 (raised on non-assigned road).

**Out of scope:** Changing Open-tab assignment rules beyond status label; live Raise POST.

**Verification:** Admin → Dashboard; Site attendant → `/tickets` and sees all tickets they raised; no **New** status pills; Raised by column populated; smoke passes.

**Completion:** PR.md Phase 18 criteria pass.

---

## Phase 19: Ticket list columns + detail update/trail/images

**Objective:** Tab-specific list columns; Add Update in Modal; chronological work history; View Image gallery; preserve list tab on back; Open/Assigned bifurcation + tile alignment.

**Status:** Complete

**Tasks:**

1. Backend list `daysAfterClose`.
2. TicketList conditional Updates / Days open / Days After Close.
3. TicketDetail: Add Update → Modal (toast submit unchanged).
4. Work history ASC + pass through `photos`.
5. `ImagePreviewModal` (main + thumbs).
6. List→detail `state.from = /tickets?tab=…`; Back to tickets / crumb via `backToTickets`.
7. Backend `tabForStatus`: Open tab = unassigned only; Assigned = has assignee.
8. Backend `listStatus` + tiles: Open not attended = Open tab; assigned+Open → Under repair for list/tiles.
9. Docs finalize.

**Out of scope:** POST update API wiring; Assigned column set changes beyond Updates/Days open; new libraries; DB rewrite of legacy Open+assigned rows.

**Verification:** Lint/build; Open/Closed column checks; Open tab unassigned only; tiles match tabs; modal; trail order; gallery; back returns to same tab.

**Completion:** PR.md Phase 19 criteria pass.

---

## Phase 20: Image attachment in ticket

**Objective:** Attach images on ticket flows (Raise, Ticket Update, Ticket Close, Detail Add Update) from folder or camera; upload via `POST /api/uploads` at form submit.

**Status:** Complete

**Tasks:**

1. `services/uploads.js` — `validateImageFile`, `uploadImage`, `uploadImages`.
2. PhotoPicker: folder + `CameraCaptureModal` (overlay flip icon, crop/review full-width, no letterbox) → local Files (max 5) → parent `onChange(File[])`.
3. Camera UI: Cancel + Take photo in one row; crop → Upload / Recapture.
4. Wire Raise / TicketUpdate / TicketClose / Detail Add Update to call `uploadImages` on submit.
5. Detail Add Update: replace text Photo field with PhotoPicker.
6. Docs finalize.

**Out of scope:** Ticket create/update/close POST wiring; new camera libraries; QrScanner for photos.

**Verification:** Lint/build; folder + camera on four flows; max 5; flip overlay; crop full width; remove one thumb; toasts on errors; submit uploads then toast.

**Completion:** PR.md Phase 20 criteria pass.

---

## Phase 21: Sidebar alignment, TicketList pagination & Add Update fixes

**Objective:** Align collapsed desktop rail with shell/topbar; wire All tickets server pagination; harden PhotoPicker in modals; wire Detail Add Update to live `POST /updates` (update → upload → attach photos). Includes the Field/`div.fld` photo-× fix and Ticket Update field trim.

**Status:** Complete (git: `Phase 21: Sidebar alignment and TicketList pagination & Add Update Ticket fixes`)

**Tasks:**

1. Collapsed `.rail` icon column + brand height = `--topbar-h`; keep `--rail` / `html.rail-narrow` sync; keep topbar close (X) through collapse animation.
2. `TablePagination` + `constants/pagination.js` (limits 10/25/50/100, default 25).
3. TicketList: `page`/`limit` → `listTickets`; reset page on tab / Apply / Reset / limit.
4. `Field` → `<div class="fld">` (not `<label>`); PhotoPicker revoke-only-removed URL; Ticket Update drop Hand over / Next visit; Photos before work-done text.
5. PhotoPicker: persistent hidden folder input; source menu + camera portaled to `document.body`; Modal `elevated` for nested camera; Add photo leftmost when empty.
6. Detail Add Update: `addTicketUpdate` (photos `[]`) → `uploadImages` → `attachTicketUpdatePhotos`; gate with `canPerm(…, 'Update ticket', 'e')`; reload trail on success.
7. Raise Cancel / list Raise preserve `state.from` tab return where applicable.
8. Docs finalize for this phase (skip brand-icon asset swaps in phase notes).

**Out of scope:** Brand-mark / favicon icon swap; Users/Devices pagination; URL `page`/`limit`; Raise/Update/Close create POST (still toast except Detail Add Update); new libraries.

**Verification:** Collapse/expand + mobile drawer; TicketList pager; first photo × does not wipe thumbs; Add Update modal folder/camera; network order updates → uploads → photos PATCH; lint/build.

**Completion:** PR.md Phase 21 criteria pass.

---

## Phase 22: (next)

**Objective:** TBD — begin here after Phase 21.

**Status:** Not started

**Dependencies:** Phase 21 complete.

---

## Suggested calendar dependency graph

```text
Phase 0 ──► … ──► Phase 19 ──► Phase 20 ──► Phase 21 ──► Phase 22 (next)
```

Phases 3–7 can proceed in parallel after Phase 2 if multiple developers, but tickets before devices is preferred for shared Ticket/Device link testing.
