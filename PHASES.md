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

**Verification:** Each page vs original HTML; raise→update→close navigation; New tab Assign buttons; report Day/Week/Month.

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

## Suggested calendar dependency graph

```text
Phase 0 ──► Phase 1 ──► Phase 2 ──┬──► Phase 3
                                  ├──► Phase 4
                                  ├──► Phase 5
                                  ├──► Phase 6
                                  └──► Phase 7
                                         │
                                         ▼
                      Phase 8 ──► Phase 9 ──► Phase 10 ──► Phase 11
```

Phases 3–7 can proceed in parallel after Phase 2 if multiple developers, but tickets before devices is preferred for shared Ticket/Device link testing.
