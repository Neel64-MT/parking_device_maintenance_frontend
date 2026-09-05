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
- Forgot password: reuse existing token email flow; do not invent OTP.
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

## Definition of done (per page)

- Matches original layout and key measurements
- Links use React routes
- Parent menu highlight works
- Mobile behavior preserved where applicable
- Preview toasts/forms behave as original
- No new features from the “do not add” list
- Lint passes for touched files
