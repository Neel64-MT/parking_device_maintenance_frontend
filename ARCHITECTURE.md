# ARCHITECTURE.md — App Architecture

## App flow & architecture

```text
Browser
  → React Router
  → /login|/signup (AuthLayout, no rail)  OR  RequireAuth → AppLayout
  → Page component (Dashboard, TicketList, …)
  → Page-local UI + shared components
  → data/ mock modules (most screens) + services/auth for session
  → toast helper
```

### Page flow (product)

Landing pages are menu destinations. Flow screens are routes reached by buttons/links; the sidebar highlights the parent via `match` lists (same idea as `nav.js`).

### State flow

| Kind | Approach |
|------|----------|
| Nav open groups, mobile rail | Local state in Layout / Sidebar |
| Tabs, filters, view switchers | Local `useState` on the page |
| Cascading issue selects | Local state or small controlled pair component |
| Photo picker count | Local state in PhotoPicker |
| Toast | Tiny module or React context (one provider max) |
| Auth / session | `AuthContext` + Bearer JWT in `localStorage`; login via sibling backend |
| Global store (Redux/Zustand) | **Not needed** |

### Data flow

Original is a design preview: data lives in HTML rows and `app.js` / page scripts. React migration:

1. Move `ISSUE_MASTER`, `PART_MASTER`, `TEAM`, report datasets into `src/data/`.
2. Keep sample table rows as typed/plain JS arrays colocated with the page or under `src/data/`.
3. API seam in `src/services/` — auth is wired; other screens still use mocks until connected.

### Routing

React Router. Paths mirror original filenames without `.html` (and use path params where ids appear later). Auth routes: `/login`, `/signup`.

### Authentication / authorization

- **Original:** Hardcoded user chip; permission matrix is UI-only on Users → Roles.
- **React (Phase 10):** Login with email or mobile + password against `../backend` (`POST /api/auth/login`). JWT Bearer token. `/signup` explains Admin-created accounts only. Topbar shows session user. Menu visibility by role is not enforced in the UI yet — backend remains authoritative when APIs are called.

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
    ├── routes.jsx              # Auth routes + 15 screens + /dev/ui
    ├── index.css               # Tailwind + ported original CSS + auth layout
    ├── config/
    │   └── nav.js              # MENU, APP (from nav.js)
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── PageMetaContext.jsx
    │   └── ToastContext.jsx
    ├── services/
    │   ├── api.js
    │   └── auth.js
    ├── data/                   # ISSUE_MASTER, tickets, devices, roads, users, …
    ├── layouts/
    │   ├── AppLayout.jsx       # rail + shell + outlet
    │   └── AuthLayout.jsx      # login/signup chrome
    ├── components/
    │   ├── layout/             # Sidebar, Topbar
    │   ├── icons/
    │   └── ui/                 # Button, Panel, Pill, JumpLinks, …
    ├── pages/
    │   ├── auth/               # Login, Signup
    │   ├── Dashboard.jsx
    │   ├── Users.jsx
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
| State | React local state (+ optional toast context) | Preview complexity |
| Data | Static JS modules | Original has no API |
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
