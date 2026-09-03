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
| **Project manager** | Dashboard, reports, masters, assign/close; not user admin |
| **Admin** | Full control including users and roles |
| **AMC officer** | View-only across roads |

Preview UI originally hardcoded user **Alkesh P. / Project manager** in the sidebar. **Phase 10** adds real login (email or mobile + password) against the sibling backend API. `/signup` is informational only — Admin creates accounts.

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

1. Dashboard — fleet strip, why-down ranked bars, road-wise table, open tickets
2. All tickets — tiles, filters, New/Assigned/Closed tabs, table
3. Raise ticket — mobile-first steps: device, problem, assign
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

#### Shared chrome

- Fixed navy sidebar (`nav.js` MENU + icons)
- Sticky topbar (title, crumb, actions template, user chip)
- Mobile hamburger drawer at ≤820px
- Toast notifications
- Jump pill strips on landing pages
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
| Backend APIs / persistence | Auth wired; most screens still use mock `src/data/` |
| Empty / loading / error states for async | Auth boot + login errors; other screens mostly static |
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

A reviewer comparing original HTML pages side-by-side with React routes cannot spot intentional redesign differences in layout, typography, color, spacing, or primary interactions. All 15 screens exist as routes. Shared nav/menu matching works. Field flows remain mobile-first with sticky bars.

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
| `/signup` informational (no self-register) | Pass |
| RequireAuth wall on app routes | Pass |
| Topbar user from session + Log out | Pass |
| Sibling backend on port 5000 | Required for login (`../backend`) |
