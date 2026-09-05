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
| **Technician** | Update visits on site, close tickets they hold, mobile-first flows |
| **Control room** | Raise and assign tickets; cannot close |
| **Project manager** | Dashboard, reports, masters, assign/close; manage users / approve signups (Users `vce...`) |
| **Admin** | Full control including users and roles |
| **AMC officer** | View-only across roads |

Preview UI originally hardcoded user **Alkesh P. / Project manager** in the sidebar. **Phase 10** added real login against the sibling backend. **Phase 11** adds self-signup with admin approval, forgot/reset password UI, and admin change-password on Users. **Phase 12** adds Settings in the sidebar bottom utility + desktop rail collapse. **Phase 13** wires Settings account forms (profile + password) and shell/dashboard UX polish. **Phase 14** simplifies Raise ticket (no assign step) and makes field-flow action bars in-document (not fixed).

---

## Features

### Existing in original (must preserve)

#### Information architecture

**Menu landing pages only**

- Dashboard
- Tickets → All tickets, Work report
- Devices
- Masters → Issue master, Road master
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
| Assign | New tab → Assign → ticket detail |

#### Screens (15 HTML pages)

1. Dashboard — fleet strip, why-down ranked bars, road-wise table (open-tickets table removed in Phase 13)
2. All tickets — tiles, filters, New/Assigned/Closed tabs, table
3. Raise ticket — mobile-first steps: device, problem; reported-by = session user (read-only); no assign/priority step; PhotoPicker stays compact tile; Cancel / Raise actions in page flow (not fixed)
4. Update ticket — mobile-first: device → diagnosis → fixed/not fork
5. Close ticket — mobile-first: final issue, resolution, cost, confirm
6. Ticket detail — record header, work history timeline, classification, assignment trail
7. Work report — Day/Week/Month/Range, team strip, per-person panels
8. Device list — tiles, filters, table with history/ticket actions
9. Device history — record, life stats, split ticket/resolution table, parts, timeline
10. Add device — identity, location, installation form
11. Scan QR — scan simulate + manual find + result/not-found
12. Issue master — category pick list + sub-category table
13. Road master — filters + roads table
14. Add road — road details, capacity/rate, status/contact
15. Users — Users tab + Roles & permissions matrix
16. Settings — profile (name/email/mobile) + change password

#### Shared chrome

- Fixed navy sidebar (`nav.js` MENU + icons)
- Sticky topbar (title, crumb, page-body actions preferred, user chip + logout icon with confirm modal)
- Mobile hamburger drawer at ≤820px (`railOpen`)
- Desktop expand/collapse icon-rail ≥821px (`railCollapsed`; expanded 248px / collapsed ~64px)
- Settings link in sidebar bottom section above EXILIO / version
- Toast notifications
- Jump pill strips on landing pages (optional right-side actions)
- Interlinked codes (ticket, device, road)

#### Domain behavior (preview / UI rules)

- Issue category → sub-category cascading selects from `ISSUE_MASTER`
- Part chips from `PART_MASTER`
- Duplicate open-ticket warning on raise (demo for PD-0428)
- Reclassification amber strip on update/detail
- Device status shown as Working / Under repair / Not working (derived concept in product; preview shows static pills)
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
Reported by → signed-in user (read-only); assignment left to Admin / control room
PhotoPicker → original compact 86×86 dashed tile (not full-width strip)
Action bar → .sticky-bar position:static; .sticky-bar-inner max-width 580px (match .mobile)
No white full-bleed footer; transparent bar; Raise / Update / Close pages share pattern
```

| Criterion | Result |
|-----------|--------|
| Raise has no “Who should attend” step | Pass |
| Reported by shows session user name | Pass |
| Add photo remains compact tile | Pass |
| Cancel / primary actions not `position: fixed` | Pass |
| Action row width matches mobile form (`580px`) | Pass |

### Phase 15 — Ticket visibility + PM signup approval

| Criterion | Result |
|-----------|--------|
| Non–Admin/PM ticket list/detail: assignee OR raised_by only | Pass |
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
