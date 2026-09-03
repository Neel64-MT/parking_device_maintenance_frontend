# ARCHITECTURE.md — App Architecture

## App flow & architecture

```text
Browser
  → React Router (one route per original HTML page)
  → AppLayout (Sidebar + Topbar + Outlet)
  → Page component (Dashboard, TicketList, …)
  → Page-local UI + shared components
  → data/ mock modules (ISSUE_MASTER, REPORT, sample tables)
  → toast helper (no backend yet)
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
| Auth / session | None in original — keep mock `APP.user`; no auth library yet |
| Global store (Redux/Zustand) | **Not needed** for preview parity |

### Data flow

Original is a design preview: data lives in HTML rows and `app.js` / page scripts. React migration should:

1. Move `ISSUE_MASTER`, `PART_MASTER`, `TEAM`, report datasets into `src/data/`.
2. Keep sample table rows as typed/plain JS arrays colocated with the page or under `src/data/`.
3. Leave a clear seam (`src/services/`) for future API calls without wiring fake fetch until a backend exists.

### Routing

React Router. Paths mirror original filenames without `.html` (and use path params where ids appear later).

### Authentication / authorization

- **Original:** Hardcoded user chip; permission matrix is UI-only on Users → Roles.
- **React:** Preserve matrix UI and role help tables. Do not invent a login wall during migration unless approved. When APIs arrive, backend remains authoritative; UI checks mirror roles.

---

## Folder & file structure

Prefer page-centric, shallow structure. Adapt as files are added; do not invent layers without need.

```text
frontend/
├── PR.md, ARCHITECTURE.md, RULES.md, DESIGN.md, MEMORY.md, PHASES.md, SKILLS.md
├── package.json
├── vite.config.js
├── index.html
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                 # Router + ToastProvider (if any)
    ├── index.css               # Tailwind + any unavoidable custom CSS
    ├── assets/                 # SVGs / static imports if needed
    ├── config/
    │   └── nav.js              # MENU, APP, ICON paths (from nav.js)
    ├── data/
    │   ├── issueMaster.js
    │   ├── partMaster.js
    │   ├── team.js
    │   ├── workReport.js
    │   └── …sample lists as needed
    ├── layouts/
    │   └── AppLayout.jsx       # rail + shell + outlet
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   └── Topbar.jsx
    │   └── ui/                 # only genuinely shared pieces
    │       ├── Button.jsx
    │       ├── Panel.jsx
    │       ├── Pill.jsx
    │       ├── Toast.jsx
    │       ├── JumpLinks.jsx
    │       ├── FilterBar.jsx
    │       ├── Tabs.jsx
    │       ├── PhotoPicker.jsx
    │       ├── IssueSelects.jsx
    │       ├── DeviceCard.jsx
    │       ├── EmptyState.jsx
    │       └── Icons.jsx
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── tickets/
    │   │   ├── TicketList.jsx
    │   │   ├── TicketRaise.jsx
    │   │   ├── TicketUpdate.jsx
    │   │   ├── TicketClose.jsx
    │   │   ├── TicketDetail.jsx
    │   │   └── WorkReport.jsx
    │   ├── devices/
    │   │   ├── DeviceList.jsx
    │   │   ├── DeviceDetail.jsx
    │   │   ├── DeviceAdd.jsx
    │   │   └── ScanQr.jsx
    │   ├── masters/
    │   │   ├── IssueMaster.jsx
    │   │   ├── RoadList.jsx
    │   │   └── RoadAdd.jsx
    │   └── Users.jsx
    ├── hooks/                  # only if reused 2+ times (e.g. useTableSearch)
    ├── services/               # empty or stubs until API exists
    ├── utils/
    │   └── toast.js            # if not context-based
    └── routes/
        └── index.jsx           # route table
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
