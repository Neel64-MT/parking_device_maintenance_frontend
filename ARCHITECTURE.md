# ARCHITECTURE.md — App Architecture

## App flow & architecture

```text
Browser
  → React Router
  → /login|/signup|/forgot-password|/reset-password (AuthLayout, no rail)
      OR  RequireAuth → AppLayout
  → Page component (Dashboard, TicketList, Settings, …)
  → Page-local UI + shared components
  → data/ mock modules (most screens)
      + services/auth (session, profile, password)
      + services/users (Users admin)
  → toast helper
```

### Page flow (product)

Landing pages are menu destinations. Flow screens are routes reached by buttons/links; the sidebar highlights the parent via `match` lists (same idea as `nav.js`). Settings is a bottom utility landing page (not a flow parent).

### State flow

| Kind | Approach |
|------|----------|
| Nav open groups, mobile rail, desktop collapse | Local state in Layout / Sidebar (`railOpen` ≠ `railCollapsed`) |
| Tabs, filters, view switchers | Local `useState` on the page |
| Cascading issue selects | Local state or small controlled pair component |
| Photo picker count | Local state in PhotoPicker |
| Toast | Tiny module or React context (one provider max) |
| Auth / session | `AuthContext` + Bearer JWT in `localStorage`; login/profile/password via sibling backend |
| Global store (Redux/Zustand) | **Not needed** |

### Data flow

Original is a design preview: data lives in HTML rows and `app.js` / page scripts. React migration:

1. Move `ISSUE_MASTER`, `PART_MASTER`, `TEAM`, report datasets into `src/data/`.
2. Keep sample table rows as typed/plain JS arrays colocated with the page or under `src/data/`.
3. API seam in `src/services/` — auth (incl. Settings profile/password) and Users admin are wired; other screens still use mocks until connected.

### Routing

React Router. Paths mirror original filenames without `.html`. Auth routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`. App: 15 original screens + `/settings`.

### Authentication / authorization

- **Original:** Hardcoded user chip; permission matrix is UI-only on Users → Roles.
- **React (Phase 10–11):** Login with email or mobile + password against `../backend`. JWT Bearer token.
- **Signup approval:** `POST /api/auth/signup` creates `status=Pending` (default role Site attendant). **Admin or Project Manager** (Users `e`) reviews on Users, may PATCH details/role, then `PATCH { status: 'Active' }`. Login rejects Pending with `PENDING_APPROVAL`.
- **Ticket visibility (backend):** Admin / Project manager keep city-wide access. Everyone else: SQL `(assignee_id = me OR raised_by_user_id = me)` via `lib/ticket-access.ts` on list/export/detail. **Ticket list/export do not AND `assigned_roads`** — that hid tickets a Site attendant raised on other roads. Detail: raiser/assignee pass before road check. Assign uses road scope only (so Control room can assign). Dashboard open-ticket queries use the same visibility fragment.
- **Ticket UI (Phase 16):** TicketList, Dashboard, and TicketDetail call live APIs and render whatever the backend returns. Frontend does not filter tickets for security. Raise/Update/Close/WorkReport remain mock.
- **QR scan (Phase 17):** `QrScannerModal` opens the device camera for **Site attendant** and **Technician** only. Scans resolve via mock `resolveScan` until QR payload is finalized. Site attendant Raise shows device info (incl. lat/lng) and blocks a second open ticket (`status ≠ Closed`). Technician Update opens the camera then keeps the existing mock inspection UI.
- **Home + Dashboard (Phase 18):** `homePathForUser` / `isDashboardRole` — only **Admin** and **Project manager** land on `/dashboard` after login (and see Dashboard in the sidebar). Other roles → `/tickets`. `HomeRedirect` for `/` and unknown routes; Dashboard page redirects others away.
- **Ticket status (Phase 18):** Product statuses no longer include **New**; create/list display **Open**. FE `normalizeTicketStatus` + BE `displayStatus`; migration `007_ticket_status_open.sql` rewrites stored rows when run.
- **Ticket list columns (Phase 18):** **Raised by** (`raisedBy` from API) immediately before **Assigned to**. Open tab label (route/query tab id remains `new`).
- **Forgot/reset:** Existing backend `POST /api/auth/forgot-password` + `reset-password` (SHA-256 token, 1h TTL, bcrypt). FE: `/forgot-password`, `/reset-password`.
- **Admin change password:** Reuse `PATCH /api/users/:id` with `password` (requires Users edit). Increments `password_version` (invalidates JWTs).
- **Self-service Settings (Phase 13):**
  - `PATCH /api/auth/me` — current user updates `fullName`, `email`, `mobile` (role read-only in UI).
  - `POST /api/auth/change-password` — `currentPassword` + `newPassword`; denies old JWT, reissues token so session continues.
- **Logout:** Topbar logout icon → confirmation modal → `POST /api/auth/logout` + clear local token → `/login`.
- **Existing users:** Migration adds `Pending` to status CHECK; seeded Active users unchanged.
- **Menu gating:** Sidebar `filterMenuByView` + `canPerm` (`v`); Dashboard also requires Admin/PM; Settings always visible. Backend remains authoritative for data.

---

## Folder & file structure

Prefer page-centric, shallow structure. Adapt as files are added; do not invent layers without need.

```text
frontend/
├── PR.md, ARCHITECTURE.md, RULES.md, DESIGN.md, MEMORY.md, PHASES.md, SKILL(S).md
├── package.json
├── vite.config.js            # /api + /uploads → localhost:5000
├── index.html
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                 # BrowserRouter + Toast + Auth + PageMeta
    ├── routes.jsx              # Auth routes + screens + /settings + /dev/ui
    ├── index.css               # Tailwind + ported original CSS + auth + tooltip
    ├── config/
    │   └── nav.js              # APP, MENU, SETTINGS
    ├── context/
    │   ├── AuthContext.jsx     # login, logout, refresh, updateProfile, changePassword
    │   ├── PageMetaContext.jsx
    │   └── ToastContext.jsx
    ├── services/
    │   ├── api.js
    │   ├── auth.js             # login, me, updateProfile, changePassword, logout, …
    │   ├── users.js            # Users admin + canPerm + homePathForUser / isDashboardRole
    │   ├── tickets.js          # list/get + New→Open normalize
    │   ├── dashboard.js
    │   └── devices.js          # resolveScan mock (+ scan helpers)
    ├── data/                   # ISSUE_MASTER, tickets, devices, roads, dashboard, scanDevice, …
    ├── layouts/
    │   ├── AppLayout.jsx       # railOpen (mobile) + railCollapsed (desktop) + shell
    │   └── AuthLayout.jsx      # login/signup chrome
    ├── components/
    │   ├── layout/             # Sidebar (filterMenuByView + Dashboard role gate), Topbar
    │   ├── icons/              # NavIcons (incl. logout)
    │   └── ui/                 # Button, Panel, Pill, JumpLinks, Tooltip, QrScannerModal, …
    ├── pages/
    │   ├── auth/               # Login (homePathForUser), Signup, Forgot, Reset
    │   ├── Dashboard.jsx       # Admin/PM only; fleet + why-down + road-wise
    │   ├── Users.jsx
    │   ├── Settings.jsx        # profile + password forms
    │   ├── UiKitDemo.jsx       # /dev/ui scratch (not in menu)
    │   ├── tickets/            # TicketList Raised by column; Open tab label
    │   ├── devices/
    │   └── masters/
    └── hooks/
        └── useTableSearch.js
```

### Maintainability rule

A developer should open `pages/tickets/TicketList.jsx` and find the table, tab state, and filters without digging through factories or HOCs. Shared chrome lives in `layouts/` + `components/layout/`. Shared look-and-feel primitives live in `components/ui/` only when used on multiple pages.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Bundler | Vite (already present) | Existing project |
| UI library | React 19 | Existing project |
| Styling | Tailwind CSS v4 (or v3) + theme tokens matching `:root` | Required migration target |
| Routing | `react-router` (DOM) | Multi-page app; skill requires router |
| Icons | Inline SVG components (from `nav.js` / page SVGs) | No icon library needed |
| Forms | Controlled React inputs | Matches preview; no Formik |
| State | React local state (+ toast / auth context) | Preview + session |
| Data | Static JS modules + auth/users/tickets/dashboard services | Progressive API wiring |
| QR (Phase 17) | `html5-qrcode` via `QrScannerModal` | Camera scan for attendant/tech only |
| Types | Optional JSDoc or migrate to TS later | Skill prefers types; original is JS — start JSX/JS for parity speed unless team requires TS |

### Libraries to avoid (for now)

Redux, Zustand, React Query, CSS-in-JS, UI kits (MUI/Ant/Chakra), chart libraries. Extra camera SDKs beyond the approved `html5-qrcode` path.

### Dependencies to add during setup phase

- `tailwindcss` (+ Vite plugin / PostCSS as appropriate for chosen major)
- `react-router-dom`
- `html5-qrcode` (Phase 17 — already added)

---

## Original architecture (reference)

```text
parking_maintenance/
├── *.html                 # 15 pages, each self-contained main content
└── asset/
    ├── style.css          # design system + all components
    ├── nav.js             # APP, MENU, sidebar/topbar inject
    └── app.js             # toast, ISSUE_MASTER, helpers
```

Every page: empty `#rail` / `#topbar`, optional `#topbar-actions` template, then page markup + inline scripts.

React replaces inject-on-load with components and routes; CSS tokens move into Tailwind theme; helpers become modules/hooks.

### Sidebar (Phase 12)

```text
aside.rail[.collapsed]
  brand (glyph P + APP title/sub + desktop collapse toggle + mobile close)
  nav (MENU — leaf Links / group expand; filterMenuByView + Dashboard Admin/PM gate)
  rail-bottom
    Settings (SETTINGS config — not in MENU)
    rail-foot (EXILIO / version)
```

| Concern | Mechanism |
|---------|-----------|
| Mobile drawer | `railOpen` in AppLayout; CSS ≤820px transform |
| Desktop icon-rail | `railCollapsed` in AppLayout; `html.rail-narrow` sets `--rail` to `--rail-collapsed` |
| Active item | `PageMeta` `pageId` + `isMenuItemOn` |
| View permission | `filterMenuByView` + `canPerm(…, 'v')` |
| Dashboard item | Extra `isDashboardRole` (Admin / Project manager only) |
| Collapsed groups | Click expands rail then opens group (no flyout) |
| Collapsed labels | CSS opacity/max-width; native `title` tooltips |
| Persistence | None |

### Shell width (Phase 13)

```text
.shell { margin-left: var(--rail); width: calc(100% - var(--rail)); }
.page  { width: 100%; max-width: none; }   /* fills shell; was 1360px cap */
```

Landing filters and primary CTAs live in the page body (`.page-toolbar`, panel-head actions, JumpLinks `actions`), not the sticky topbar.

### Field ticket flows (Phase 14)

```text
Raise / Update / Close
  → .page.mobile (max-width 580px)
  → panels…
  → .sticky-bar > .sticky-bar-inner (in-flow actions, not position:fixed)
```

| Concern | Mechanism |
|---------|-----------|
| Raise steps | Device + problem only; reported-by from `AuthContext` |
| No assign on raise | Control room / Admin assigns later |
| Photo picker | Compact `.photo-add` tile (shared `PhotoPicker`) |
| Action bar | `position: static`; transparent; width capped at `580px` via `.sticky-bar-inner` |
| Pages | `TicketRaise`, `TicketUpdate`, `TicketClose` |

### Post-login home (Phase 18)

```text
Login / GuestOnly / `/` / `*`
  → Admin | Project manager → /dashboard
  → everyone else           → /tickets
```

Helpers: `isDashboardRole`, `homePathForUser` (`services/users.js`); `HomeRedirect` (`AuthContext.jsx`).
