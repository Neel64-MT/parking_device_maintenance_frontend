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

- Phase 51 "Every Ticket, Every Road": All tickets `v` → every ticket; Update ticket `e` → Add Update on any open ticket; `x` → close. Gate UI with `canPerm` only — no assignee, holder, ops-role or field-role checks.
- There is no assignment API or UI: `assignTicket`, `filterAssignableAssignees`, `ASSIGNABLE_ASSIGNEE_ROLES`, `isOpsTicketUpdater`, the Assign Modal, the raise Assign to and the All Tickets assignee filter were removed. `listTechnicianLookups()` still feeds Visited by and the Work report person dropdown.
- PM signup approval = Users `e` on existing PATCH — sync FE `ROLES` matrix with `DEFAULT_ROLE_PERMS`.

## Frontend ticket API skills (Phase 16+)

- Wire list/dashboard/detail to `/api/tickets` and `/api/dashboard`; render API payload as-is.
- Reuse `canPerm` + Users loading/empty/error; do not add React Query or a role store.
- Ticket list envelope includes `tiles` / `tabCounts` / `over3Counts` beside `data` — use `apiEnvelope` (or equivalent), not `api()` alone.
- Never treat client-side row filtering as authorization.

## QR scan skills (Phase 17+ / 27+)

- Use `QrScannerModal` + `html5-qrcode`; stop the camera on close.
- Gate camera with `canScanWithCamera(user)` — any signed-in user.
- Resolve scans through `services/devices.resolveScan`: sticker `qr_token` → `POST /api/devices/slot-mac`; legacy PD/QR/slot → `GET /api/devices/scan?q=` (404 → null). Never call SmartPark from the browser.
- Site attendant Raise: map scan fields; create via `createTicket` (`photos: []`) + `issues[]` from `TicketIssueRows` / `listIssueCategories`, then optional `uploadImages` → `attachTicketRaisePhotos`. An open ticket on the device does **not** block Raise (Phase 50) — only the same Open issue does.
- Raise open tickets (Phase 50): `scanOpenTickets(scan)` → one `.reclass` row per ticket ("Open issues: …" via `openTicketIssueLabel`) with primary **Update Ticket** → `/tickets/update?ticketId=` (+ `qr` state) and secondary Open → Detail. Copy: "Same problem? Update that ticket. Different problem? Raise a new ticket below."
- Raise duplicate check: `findOpenIssueDuplicates(scan, rowsToIssuePairs(rows))` before `createTicket`; every selected issue on one ticket → toast + `goToUpdateTicket`; otherwise toast the duplicate names and stop. `409 OPEN_TICKET_EXISTS` → same branching from `err.details.issues`, then re-resolve the scan without clearing the form.
- Update Ticket page: live `resolveScan` or entry `ticketId`; one open ticket → auto `activateTicket`; several → pick list with each ticket's open issues and **Update this ticket** (same `activateTicket`) plus "Raise a ticket for a different issue" (`/tickets/raise` + `qr`); `loadUpdatableTicket` (`getTicket`; only Closed is refused); show `TicketAddUpdateForm` with `reportedIssues`; free → Raise (+ `qr`).
- DeviceCard facts / tone come from `scanDeviceFacts` / `scanStatusTone`, which read `openTickets` ("Open tickets: TK-1 — Motor failure (2 days); TK-2 — …"). Do not rebuild that string in pages.
- Multi-issue: reuse `TicketIssueRows` + `IssueSelects`; Update starts blank and sends the selected `issues[]`; Sub-category is stacked below category; Detail prefers `issuesReported` / `issuesFound`. Parts were changed uses one radio with a single Yes option; order the searchable PartChips dropdown, removable selected tags, Labour / other charges, then the Parts Total / optional Labour / Total Amount summary. Reject negative labour; do not add a payload field.
- Site attendant Sync / Issue Master: rely on `/api/auth/me` permissions after migration 018; do not hardcode the role.
- Detail header: Update ticket `v` + `e` and not Closed → Add update + Resolve Modal (shared form). No QR-only fallback link (Phase 51).

## Ticket raise / update / close skills (Phase 47+)

- Field roles: use `FIELD_ROLES` / `isFieldRole` from `services/users.js`; never write `role === 'Technician' || role === 'Engineer'` chains. Raise access is `canPerm(user, 'Raise ticket', 'c')`.
- **Close Ticket** Yes / No is part of `TicketAddUpdateForm` (`canClose` = Update ticket `x`), defaults to **No** everywhere, and only Yes adds `closeTicket: true` — one POST, no second close call. Reuse `.update-parts-choice` radio styling.
- **Resolve** = the same Add Update modal with `initialUpdateType="Site visit — resolved"`; it never closes by itself.

## Per-issue resolution skills (Phase 49+)

- Only **reported** issues have Open/Resolved. Derive resolvable issues with `openReportedIssues(ticket.issuesReported)` from the latest `getTicket`, then pass them as `TicketAddUpdateForm` `openIssues` — Detail (Add update + Resolve) and `/tickets/update` (QR) both do this; never add a QR- or role-specific copy.
- Resolve via the form's chips (existing `.chip-row` / `.chip on` pattern) → `resolveIssueIds` on the same Add Update POST. No separate issue-status API, no client-side "resolved" cache.
- Backend is the source of truth: `400 INVALID_ISSUES` / `409 ISSUE_ALREADY_RESOLVED`; the 409 goes through `onConflict` (reload).
- Resolving the last issue never closes the ticket; Close Ticket keeps its default **No**. Closing resolves leftovers on the server — show the hint, do not pre-resolve.
- Keep the found-on-site `TicketIssueRows` separate from the Resolve issues chips.
- Dashboard "Why devices are down" is issue-level (`downReasons`, `openIssues`, `openTicketsCount` from the API); everything else on the Dashboard stays ticket/device-level.
- Several users may resolve different issues of the same ticket (Phase 50); each sees only the remaining Open issues because every entry point re-reads `getTicket`. Do not cache issue status between users or tickets.
- Device status with several open tickets is decided by the backend (worst ticket). Dashboard, Device list and Device detail render the API values — never derive device status from a ticket list in React.

## Main/Sub issue panels skills (Phase 51+)

- `TicketResolveIssues` (`components/tickets/`) renders the Resolve Issues block inside `TicketAddUpdateForm`. Input: `reportedIssues` (every reported issue from `getTicket`, Open and Resolved). Group with `groupIssuesForResolve` (`components/tickets/ticketIssueRowsHelpers.js`) — never re-group by category name strings in a page.
- Every raised group is listed at once and starts **expanded** (Phase 52; the Phase 51 collapsed start and **Another Issue** reveal are gone). **Add another issue** is always shown below them and opens the "New issues" block built from `TicketIssueRows` / `IssueSelects`.
- Main checkbox → `resolveCategoryIds`; sub checkbox → `resolveIssueIds`. When a main is checked, its subs render checked + disabled and are not sent separately. Resolved subs and fully resolved mains are filtered out after `groupIssuesForResolve` (Phase 52 follow-up), so a second scan / update shows only Open issues.
- New rows → `addIssues: [{ categoryId, subCategoryId }]`; skip incomplete rows; no client duplicate guard beyond UX — the backend answers `409 ISSUE_ALREADY_ON_TICKET` / `OPEN_TICKET_EXISTS` (toast + `onConflict` reload).
- Every entry point (Detail Add update / Resolve, `/tickets/update`, QR) passes the same `reportedIssues` prop; no role- or QR-specific branches.

## Ticket detail / list UI skills (Phase 19+)

- TicketList: one table with `showUpdates` / `showDaysOpen` / `showDaysAfterClose` from `tab` — do not fork three tables.
- List→detail: pass `state={{ from: `/tickets?tab=${tab}` }}`; detail resolves Back/crumb with `ticketsListReturnPath(state.from)`.
- Tabs come from API `tab` / `tabCounts` — `open` (no update yet), `urp` (at least one update) and `cls` (Phase 52). `parseTab` sends `asg` to `urp` and other unknown values to `open`. Do not re-filter in React for security.
- Clickable summary cards (Phase 52): wrap `Tile` in `button.tile-link` with `aria-pressed` + `tile-selected` (same as Device list). Map a card to `{ tab, status, age }` in one helper (`viewForTile`) and derive the highlight from the applied state (`isTileSelected`); set the URL tab and `applied` together so one fetch runs.
- Tab slide (Phase 52): the shared `Tabs` owns the `.tabs-ink` underline (DOM-positioned in `useLayoutEffect`, `ResizeObserver`, `data-ready` turns the transition on after first placement). For a sliding pane, key the content by tab and pick `tab-pane-next|prev` from the tab order; adjust state during render (not in an effect) so the new pane never shows the old rows. Always add a `prefers-reduced-motion` override.
- Tiles come from API; a historical assigned+Open ticket may appear as Under repair via backend `listStatus`.
- Add Update: open existing form in `Modal`; keep toast submit until POST is wired.
- Work history: reverse mapped events for chronological display; pass `photos`, `actor`, `parts` through.
- Gallery: `ImagePreviewModal` on `Modal` — main image + thumbnail row; Zoom in / Zoom out / Reset / Rotate via CSS `transform` only; desktop hover zooms toward pointer; pinch + drag pan on touch; reset on thumbnail change; no new deps.
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

## Users role hierarchy (Phase 35+)

- Use `ROLE_HIERARCHY` / `filterAssignableRoles` from `services/users.js` (same order as backend Phase 36).
- Create and edit role dropdowns: same-or-below only; still require Users `c` / `e`.
- On edit PATCH, omit `roleId` when unchanged so non-role edits on higher-role users do not hit hierarchy `403`.
- Do not hardcode per-role `if` chains; do not invent an `allowedTargetRoles` API unless backend adds one.
- Roles & permissions matrix is live (`listRoles` / `createRole` / `updateRolePermissions`); gate with Roles & permissions `v`/`c`/`e`.
- Protect routes with `RequirePerm` (inside `RequireAuth`); do not rely on sidebar hide alone.

- Use `listParts()` from `services/parts.js` (session cache); do not fetch per chip click.
- `PartChips` selects by UUID; submit `parts: id[]` and labour-only `cost`.
- Display backend `cost` / `partsCost` after save; never send a client-calculated visit total as authoritative.
- Ticket list `updates` is backend-counted from Update Ticket event types only; include `reclassified`, exclude raised/assigned/closed, and do not filter by role.

## Issue Master (Phase 32 / 34+)

- Use `listIssueCategories()` from `services/issues.js` (session cache); pass `{ force: true }` after mutations.
- Create: `createIssueCategory` / `createIssueSubcategory` (`Issue master` `c`); hard delete unused via `deleteIssueCategory` / `deleteIssueSubcategory` (`d`); on `409 IN_USE` deactivate (category needs `e` for PATCH).
- Keep master-detail (category pick-list + subcategory table); do not hardcode category lists on Issue Master.
- Raise Ticket already loads live categories; do not invent a second Issue list API for Master.

## Device Sync skills (Phase 26+)

- Call our backend only: `POST /api/device-sync`, poll `GET /api/device-sync/:id` (resume via `/latest`).
- Never call SmartPark / `device-binding` from the browser.
- Gate Sync Devices on `canPerm(user, 'Device list', 'c')`; disable button while `started`.
- Keep UI non-blocking; reuse `toast`, `Button`, `listDevices` reload via token — no React Query.
- Device list columns: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location; null → `—`.
- After `completed`, refetch current page/filters; do not reset pagination state.
- On complete, toast `devicesCreated` / `devicesUpdated` / `devicesSkipped` from `run.stats` when numeric; do not invent other stats fields.
- Backend owns skip/upsert validation; FE never creates devices from sync payloads.
- Device list status tiles filter via `listDevices({ status })` on the same page; do not route Under repair / Not working to `/tickets`.

## Slot Label order skills (Phase 44+)

- Device list is ordered by Slot Label **in the backend SQL** (`GET /api/devices` → `ORDER BY slot_number`); do not add client-side sorting there — it would only order the current page and break `LIMIT/OFFSET` pagination.
- Ticket list order stays `raised_at DESC`; it has no Slot Label column.
- *(The Phase 44 Assign dropdown helpers were removed with assignment in Phase 51.)*
- Slot View list (Phase 53) arrives in **natural** Slot Label order from `GET /api/slot-view` (`3-2` before `3-12`); same rule — never re-sort in React.

## Slot View skills (Phase 53+)

- Slot View is a landing page (sidebar item after Dashboard, own `Slot View` v matrix screen — Admin + Project manager by default), not a flow; its detail is `/slot-view/:slotId`, highlighted through `match: ['slot-detail']`.
- Trust the backend for every slot rule: which slots appear (only ticketed), `ticketCount` (tickets, not issues), `unresolvedIssues` (persisted Open Sub Issues, unique per Sub Issue). Do not fetch all tickets / devices to group, count or filter in the browser.
- Slot tickets: `listTickets({ device: slotId })` without `tab` (every status, Closed included) rendered by the shared `TicketTable` — do not copy the ticket table markup into a page.
- Ticket links from a slot pass `state.from = /slot-view/:slotId` so Ticket Detail's back link returns to the slot; always use the existing `/tickets/:ticketId` route.
- Unresolved issues reuse `groupIssuesForDisplay` and the Ticket Detail `.issue-*` styles; empty → `EmptyState` "No unresolved issues".

## Notification skills (Phase 39+)

- Consume `services/notifications.js` and the existing backend `/api/notifications` endpoints; preserve backend pagination with `apiEnvelope`.
- Keep one `useTicketNotifications` owner in `AppLayout`; pass its count to `Topbar` and `Sidebar` so the bell and both ticket badges cannot drift.
- Gate the UX with the existing role names plus `canPerm(user, 'All tickets', 'v')`; never use client state as authorization.
- Use `public/sw.js` for `push` and `notificationclick`; the page handles protected mark-read requests because the JWT is in `localStorage`.
- Play `public/sounds/elevenlabs-achievement-unlock.mp3` for a new push or unread-count increase, including an open background tab; debounce duplicate events and ignore autoplay rejection. Gate it on `soundAllowedRef` (push On and sound On); the OS sound follows the backend's `notification.silent`.
- Permission is opt-in and user-triggered from Settings only (`requestBrowserPermission` / `setPushEnabled(true)` while `default`). With permission granted, `ensureSubscription` re-registers the existing subscription, or creates one silently when push is On; do not prompt on load or add a second SW. Wait for an active worker before `pushManager.subscribe()`.
- Settings reads the single hook instance through `useOutletContext()` (`AppLayout` passes `<Outlet context>`); never call `useTicketNotifications` a second time.
- Preference writes go through `AuthContext.updateNotificationPreferences` (`PATCH /api/auth/me/notification-preferences`, no user id). Save first, then subscribe; on failure keep the switch at the saved value and toast the error. Sound is disabled (value kept) while push is Off.
- Push Off and logout keep the browser subscription; logout deletes only this browser's server row so the next login re-registers without a prompt.
- Use backend `data.url`/`canOpen` with the existing ticket route; rely on TicketDetail for 403/404 handling.
- Opening a ticket is the read receipt: `POST /api/notifications/ticket/:ticketId/read` marks the caller's own rows for that ticket. Drive it from a route-scoped effect in the one `useTicketNotifications` owner — do not add a second mark-read path, endpoint, or counter.
- Scope the patch to the viewed ticket only, apply the backend's authoritative `updated` with a `Math.max(0, …)` floor, then re-read `unread-count`; never decrement by guesswork.
- Dedupe per ticket so rerenders and re-entry do not re-request. Keep mark-read failures non-blocking (`listError`), and never bypass 401/403.
- Render historical `ticket.assigned` / `ticket.reassigned` rows from the same popover as `ticket.raised`; attribute by type (`raisedBy` then `assignedBy`) and omit the line when neither exists. Do not hardcode ticket details in the frontend.
- Since Phase 51 the backend never creates assignment notifications; only `ticket.raised` arrives. Do not add a client-side toast, sound, or count bump for updates or resolves.

## Users delete + visibility skills (Phase 44+)

- `GET /api/users` is already visibility-scoped by the backend: your own account is absent, and a non-Admin (Project manager) never receives Admin rows. Render the payload as-is — **never** add a client-side `row.id !== user.id` or `row.role !== 'Admin'` filter. That would be a second, drifting copy of the rule.
- Delete uses `deleteUser(id)` from `services/users.js` against `DELETE /api/users/:id`, gated with `canPerm(user, 'Users', 'd')` (Admin is the only seeded role with it). No new role gains the button.
- Delete is a **hard delete** (Phase 46+): the account is removed and the backend clears its references on past tickets, so the row leaves every status-filtered list. Show the button on **every** row, `Inactive` included, and word the confirm modal as a permanent removal ("their name will no longer appear on past tickets"). Do not describe it as a deactivation.
- Reuse the existing confirm `Modal` + `Button variant="danger"` + a `deleting` busy flag (the `IssueMaster` pattern). Name the user in the copy, and state the consequence — tickets stay, the name does not.
- On success `toastApiSuccess` then `await refreshUsers()`; on failure `toastApiError(err, 'Could not delete user.')` and leave the row untouched — the backend message (e.g. `You cannot delete your own account.`) reaches the toast unchanged.
- The own row is never rendered, so a self-delete control cannot appear; the backend `SELF_DELETE_FORBIDDEN` response remains the authority.
- A role-less account (`row.roleMissing`) shows "No role — select one". Activating it is refused in `saveEdit` with the same wording as the backend `409 ROLE_REQUIRED`; the role `<select>` is the only way out. Do not add a client-side "has a role" lookup.
- The `row.you` marker is gone from the table — nothing can be "you" in your own list.
- Fall back to visible-page polling/focus refresh because the backend has no WebSocket/SSE transport.
- In TicketDetail View Update, use structured reported/found issue arrays, group by category, show all sub-categories, and fall back to scalar fields for older events; hide the issue section when no issue data exists.

## Role delete skills (Phase 46+)

- Role delete is a **Roles tab** action, not a separate page: `deleteRole(id)` in `services/users.js` → `DELETE /api/roles/:id`, gated with `canPerm(user, 'Roles & permissions', 'd')`. Reuse `roleDeleteTarget` / `deletingRole` state, do not reuse the Users `deleteTarget` / `deleting` pair.
- Reuse the Users-delete confirm pattern exactly: `Button variant="danger"` in the Action cell beside **Permissions**, a confirm `Modal` naming the role, a busy label `Deleting…`, and `closeDisabled` while the request runs.
- The assigned-role guard is **backend-only**: `409 ROLE_IN_USE` → `toastApiError(err, 'Could not delete role.')` surfaces "Role is assigned to users. Please change their role before deleting it." and the role stays in the list. Never hide or disable the button from `row.users` — that count is a stale snapshot and would be a second, drifting copy of the rule.
- Do not re-check the user list, add a lookup call, or add a client-side `ROLE_IN_USE` message constant; `ApiRequestError.message` already carries the backend text.
- On success `toastApiSuccess` then `await refreshRoles()`; the permission matrix selection (`permRoleId`) is re-resolved by `applyRolesList`, so no extra cleanup is needed when the deleted role was selected.

---

## Definition of done (per page)

- Matches original layout and key measurements
- Links use React routes
- Parent menu highlight works
- Mobile behavior preserved where applicable
- Preview toasts/forms behave as original
- No new features from the “do not add” list
- Lint passes for touched files
