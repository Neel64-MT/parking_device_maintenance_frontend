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
- **Signup approval:** `POST /api/auth/signup` creates `status=Pending` (default role Site attendant). Admin reviews on Users, may PATCH details/role, then `PATCH { status: 'Active' }`. Login rejects Pending with `PENDING_APPROVAL`.
- **Forgot/reset:** Existing backend `POST /api/auth/forgot-password` + `reset-password` (SHA-256 token, 1h TTL, bcrypt). FE: `/forgot-password`, `/reset-password`.
- **Admin change password:** Reuse `PATCH /api/users/:id` with `password` (requires Users edit). Increments `password_version` (invalidates JWTs).
- **Self-service Settings (Phase 13):**
  - `PATCH /api/auth/me` — current user updates `fullName`, `email`, `mobile` (role read-only in UI).
  - `POST /api/auth/change-password` — `currentPassword` + `newPassword`; denies old JWT, reissues token so session continues.
- **Logout:** Topbar logout icon → confirmation modal → `POST /api/auth/logout` + clear local token → `/login`.
- **Existing users:** Migration adds `Pending` to status CHECK; seeded Active users unchanged.
- Menu visibility by role is not fully enforced in the UI yet — backend remains authoritative.

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
    │   └── users.js
    ├── data/                   # ISSUE_MASTER, tickets, devices, roads, dashboard, …
    ├── layouts/
    │   ├── AppLayout.jsx       # railOpen (mobile) + railCollapsed (desktop) + shell
    │   └── AuthLayout.jsx      # login/signup chrome
    ├── components/
    │   ├── layout/             # Sidebar, Topbar (logout confirm Modal)
    │   ├── icons/              # NavIcons (incl. logout)
    │   └── ui/                 # Button, Panel, Pill, JumpLinks, Tooltip, …
    ├── pages/
    │   ├── auth/               # Login, Signup, Forgot, Reset
    │   ├── Dashboard.jsx       # fleet + why-down + road-wise (no open-tickets table)
    │   ├── Users.jsx
    │   ├── Settings.jsx        # profile + password forms
    │   ├── UiKitDemo.jsx       # /dev/ui scratch (not in menu)
    │   ├── tickets/
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
| Data | Static JS modules + auth/users services | Progressive API wiring |
| Types | Optional JSDoc or migrate to TS later | Skill prefers types; original is JS — start JSX/JS for parity speed unless team requires TS |

### Libraries to avoid (for now)

Redux, Zustand, React Query, CSS-in-JS, UI kits (MUI/Ant/Chakra), chart libraries, camera QR SDKs (until real scan is scoped).

### Dependencies to add during setup phase

- `tailwindcss` (+ Vite plugin / PostCSS as appropriate for chosen major)
- `react-router-dom`

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
  nav (MENU — leaf Links / group expand)
  rail-bottom
    Settings (SETTINGS config — not in MENU)
    rail-foot (EXILIO / version)
```

| Concern | Mechanism |
|---------|-----------|
| Mobile drawer | `railOpen` in AppLayout; CSS ≤820px transform |
| Desktop icon-rail | `railCollapsed` in AppLayout; `html.rail-narrow` sets `--rail` to `--rail-collapsed` |
| Active item | `PageMeta` `pageId` + `isMenuItemOn` |
| Collapsed groups | Click expands rail then opens group (no flyout) |
| Collapsed labels | CSS opacity/max-width; native `title` tooltips |
| Persistence | None |

### Shell width (Phase 13)

```text
.shell { margin-left: var(--rail); width: calc(100% - var(--rail)); }
.page  { width: 100%; max-width: none; }   /* fills shell; was 1360px cap */
```

Landing filters and primary CTAs live in the page body (`.page-toolbar`, panel-head actions, JumpLinks `actions`), not the sticky topbar.
