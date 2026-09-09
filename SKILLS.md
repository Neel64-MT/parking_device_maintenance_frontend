# SKILLS.md — Development Skills for This Migration

Project-specific practices for migrating Parking Device Maintenance from HTML/CSS/JS to React + Tailwind while preserving UI and behavior.

---

## React skills

- Build **page components** that mirror one original HTML file each.
- Use **props** for shared chrome slots (e.g. topbar actions).
- Prefer **local `useState`** for tabs, drawers, inline forms, chips, photo counts.
- Use **`useEffect` sparingly** — only for document title, syncing derived UI (e.g. fill slots when road changes is fine as event handler, not effect).
- Use **`useRef`** only if focusing an input after opening an inline form (original `toggleForm` focus).
- **Conditional rendering** replaces `style.display` / `classList`.
- **Controlled** selects for issue category/sub-category.
- **React Router** `<Link>` / `NavLink` / `Outlet` instead of `href="*.html"`.
- Forms: `onSubmit={(e) => { e.preventDefault(); toast(...); }}`.
- Keep components small enough to scroll once; extract only repeated blocks.

## Tailwind skills

- Put original CSS variables into theme extension / `@theme` so utilities use the same hex values.
- Map layout with flex/grid utilities matching `.shell`, `.page`, `.grid-2`, etc.
- Use responsive prefixes aligned to original breakpoints (`max-md`-style custom screens: 820, 760, 900, 940, 1080).
- States: `hover:`, `focus-visible:`, `disabled:`.
- Do **not** force every rule into utilities — keep a thin `index.css` for:
  - Sidebar chevron `::after`
  - Scan frame center line
  - Timeline spine `::before`
  - Split table group headers
  - Toast enter transition
  - Reduced-motion media query
- Typography: Archivo via font-family theme key; sizes in px as in original when needed for fidelity.

## Migration skills

### HTML → React

1. Open original `*.html`.
2. Leave rail/topbar to Layout.
3. Convert `main.page` markup to JSX (`class` → `className`, `onclick` → `onClick`, self-close tags).
4. Replace inline scripts with state/handlers in the same page file (or colocated `*Helpers.js`).

### DOM JS → React

| Original | React |
|----------|-------|
| `querySelector` + `classList.toggle` | `useState` + conditional `className` |
| `innerHTML` lists | `.map()` render |
| `addEventListener('change')` | `onChange` |
| `style.display` | `{open && <...>}` |
| `window.location.href` | `useNavigate()` / `<Link>` |
| Global `toast()` | shared toast function/context |
| `bindIssueSelects` | `<IssueSelects />` or hook |
| `photoPicker` | `<PhotoPicker />` |
| `bindTableSearch` | filter state or `useTableSearch` |

### CSS → Tailwind

1. Tokens → theme.
2. Repeated patterns → component with fixed class strings.
3. One-off page layout → utilities on the page.
4. Pseudo / complex → keep named CSS class, document in DESIGN/MEMORY.

### Assets

- No binary image library in original; copy inline SVG paths into `Icons.jsx`.
- Keep Google Fonts import.
- Do not replace icons with a new set.

### API / auth

- Auth is wired: `src/services/api.js` + `auth.js`, `AuthContext`, `/login` + `/signup`.
- Login: email or mobile + password against sibling backend (`POST /api/auth/login`).
- Store Bearer JWT in `localStorage`; Vite proxies `/api` to `http://localhost:5000`.
- `/signup` is informational — Admin creates users; no self-register.
- Preserve mock data modules until each screen is explicitly wired to APIs.
- Context is allowed for toast and auth only.

## Maintainable coding skills

- One screen → one file under `pages/`.
- Shared only if used twice+.
- Explicit names: `TicketList`, not `ListView`.
- Avoid context except toast and auth.
- Avoid custom “framework” wrappers around Router or forms.
- Prefer boring code over clever code.
- Comment only where original business rule is non-obvious (e.g. match arrays for nav highlight).

## AI development workflow

```text
Read original page + CSS section
  → Understand interactions
  → Analyze vs skill rules
  → Plan smallest change
  → Implement in destination only
  → Verify vs original
  → Document in MEMORY.md
```

AI must not invent screens, redesign, or depend on chat memory in place of MEMORY.md / source files.

## Backend / auth skills (Phase 11+)

- API analysis before change; reuse Express routes + `lib/auth.ts` (bcrypt, JWT, reset tokens).
- Database: SQL migrations only; extend status CHECK carefully; never lock out Active users.
- Authorization: `authorize(screen, flag)` — Users `e` for approve/password.
- Forgot password: reuse existing token email flow; do not invent OTP. Backend allows Admin / Project manager only; surface `FORGOT_PASSWORD_ROLE_DENIED` on the Forgot page. Unknown emails stay generic.
- 404: top-level `*` → `NotFound` + `GearLoader` (CSS only, theme tokens, no styled-components).
- Frontend: AuthLayout forms; Users page live list via `services/users.js`.
- Preferred workflow:

```text
Inspect existing code
→ Understand existing flow
→ Reuse existing patterns
→ Make minimal changes
→ Test new + existing auth
→ Update documentation
```

## Sidebar skills (Phase 12+)

- Keep `MENU` for landing pages; put Settings in a separate `SETTINGS` export rendered in `.rail-bottom`.
- Treat mobile drawer (`railOpen`) and desktop icon-rail (`railCollapsed`) as **two states** — never overload one flag.
- Drive shell offset with `--rail` CSS variables so width and `margin-left` stay in sync.
- Animate with CSS transitions; wrap labels in `.nav-label` instead of mounting/unmounting text.
- Collapsed tooltips: native `title` / `aria-label` — no tooltip library.
- Extend `NavIcons.jsx` for new glyphs; do not add lucide/heroicons.
- Collapsed group click: expand the rail, then open the group (no flyout menus).
- Collapsed column: keep glyph/nav icons centered; never invent a second left offset for the topbar.

## Ticket list pagination skills (Phase 21+)

- Pass `page` + `limit` to `listTickets`; read `pagination` from the envelope.
- Use shared `TablePagination` with limits `[10, 25, 50, 100]`; default `25`.
- On tab / Apply / Reset / limit change → `page = 1` then refetch.

## Ticket access skills (Phase 15+)

- Reuse `appendTicketVisibilitySql` / `assertTicketAccess` from backend `lib/ticket-access.ts`.
- Read paths filter by ownership; **assign** uses road scope only.
- PM signup approval = Users `e` on existing PATCH — sync FE `ROLES` matrix with `DEFAULT_ROLE_PERMS`.

## Frontend ticket API skills (Phase 16+)

- Wire list/dashboard/detail to `/api/tickets` and `/api/dashboard`; render API payload as-is.
- Reuse `canPerm` + Users loading/empty/error; do not add React Query or a role store.
- Ticket list envelope includes `tiles` / `tabCounts` beside `data` — use `apiEnvelope` (or equivalent), not `api()` alone.
- Never treat client-side row filtering as authorization.

## QR scan skills (Phase 17+)

- Use `QrScannerModal` + `html5-qrcode`; stop the camera on close.
- Gate camera with `user.role === 'Site attendant' || user.role === 'Technician'`.
- Resolve scans through `services/devices.resolveScan` (mock now; later `GET /api/devices/scan`).
- Site attendant Raise: map full scan fields; block create when `openTicketId` is set.
- Technician Update: on scan success call existing `loadTicket()` only.

## Ticket detail / list UI skills (Phase 19+)

- TicketList: one table with `showUpdates` / `showDaysOpen` / `showDaysAfterClose` from `tab` — do not fork three tables.
- List→detail: pass `state={{ from: `/tickets?tab=${tab}` }}`; detail resolves Back/crumb with `ticketsListReturnPath(state.from)`.
- Tabs come from API `tab` / `tabCounts` (`tabForStatus`: unassigned → Open, assignee → Assigned). Do not re-filter Open in React for security.
- Tiles come from API; Open not attended equals Open tab; assigned+Open may appear as Under repair via backend `listStatus`.
- Add Update: open existing form in `Modal`; keep toast submit until POST is wired.
- Work history: reverse mapped events for chronological display; pass `photos`, `actor`, `parts` through.
- Gallery: `ImagePreviewModal` on `Modal` — main image + thumbnail row; Zoom in / Zoom out / Rotate via CSS `transform` only; when zoomed, move/drag to pan (explore clipped areas); reset transform on thumbnail change; no new deps.
- Trail: **View Update** (Modal, details only — never images) on every row; **View Image** only when photos exist — keep them separate.

## Photo attachment skills (Phase 20+)

- Folder = native file input; camera = `CameraCaptureModal` (`getUserMedia` + facingMode flip → JPEG `File`); both call `uploadImage` then update thumbs/`onChange(urls)`.
- Client-validate `image/*` and 8 MB before upload; toast via existing `toast`.
- Do not use `html5-qrcode` for ticket photos.

## Loading skeletons (Phase 22+)

- Use shared `Skeleton` / `SkeletonTiles` / `SkeletonTable` for live fetches; do not invent per-page one-off loaders.
- Keep filters/JumpLinks visible where the plan says so; replace only the data region.
- Honor `prefers-reduced-motion` via CSS (no shimmer).
- Live create/update buttons: disable + busy label (`Saving…` / `Creating…`) while the request runs; gate Cancel/modal close the same way (Users create/edit/password/approve).

## Parts Master / visit cost (Phase 23+)

- Use `listParts()` from `services/parts.js` (session cache); do not fetch per chip click.
- `PartChips` selects by UUID; submit `parts: id[]` and labour-only `cost`.
- Display backend `cost` / `partsCost` after save; never send a client-calculated visit total as authoritative.

## Device Sync skills (Phase 26+)

- Call our backend only: `POST /api/device-sync`, poll `GET /api/device-sync/:id` (resume via `/latest`).
- Never call SmartPark / `device-binding` from the browser.
- Gate Sync Devices on `canPerm(user, 'Device list', 'c')`; disable button while `started`.
- Keep UI non-blocking; reuse `toast`, `Button`, `listDevices` reload via token — no React Query.
- Device list columns: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location; null → `—`.
- After `completed`, refetch current page/filters; do not reset pagination state.

## Definition of done (per page)

- Matches original layout and key measurements
- Links use React routes
- Parent menu highlight works
- Mobile behavior preserved where applicable
- Preview toasts/forms behave as original
- No new features from the “do not add” list
- Lint passes for touched files
