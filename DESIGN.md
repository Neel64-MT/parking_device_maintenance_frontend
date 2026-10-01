# DESIGN.md — Design System (from original)

Source: `parking_maintenance/asset/style.css`. Legacy design is the source of truth. Reproduce in Tailwind theme + utilities; do not invent a new system.

## Legacy design preservation

```text
Existing Design → Extract → Document → Reproduce in React/Tailwind → Verify against Original
```

## Colors & theme

| Token | Value | Use |
|-------|-------|-----|
| `--navy` | `#0F2438` | Sidebar, dark buttons, toast |
| `--navy-2` | `#16324A` | Sidebar hover/active |
| `--navy-3` | `#1E4260` | Accents, avatar, tracks |
| `--teal` | `#0E8C86` | Brand glyph, focus, active inset |
| `--teal-dk` | `#0B6E69` | Primary button, links |
| `--bg` | `#EEF1F4` | Page background |
| `--surface` | `#FFFFFF` | Panels, topbar |
| `--line` | `#D8DFE6` | Borders |
| `--line-soft` | `#E8EDF1` | Soft borders / dividers |
| `--hover` | `#F7F9FB` | Row/button hover |
| `--ink` | `#132434` | Primary text |
| `--ink-2` | `#4A5D6E` | Secondary text |
| `--ink-3` | `#7A8A99` | Muted / captions |
| `--ok` / `--ok-bg` | `#1B7F4B` / `#E6F2EB` | Success |
| `--warn` / `--warn-bg` | `#B0710A` / `#FBF0DC` | Warning |
| `--bad` / `--bad-bg` | `#B62F26` / `#FAE8E6` | Danger / open |
| `--info` / `--info-bg` | `#1E4260` / `#E7EDF3` | Info strip |

Sidebar text: `#C6D4E0`, muted `#7E93A6`, sub `#93A7B8`.

Pick selected: background `#EAF3F2`. Group header bg: `#F3F6F8`. Split resolution header: `#EAF3F2`.

## Fonts

| | |
|--|--|
| Family | **Archivo** (Google Fonts weights 400, 500, 600, 700) |
| Fallback | `system-ui, -apple-system, sans-serif` |
| Base size | `14px` |
| Line height | `1.45` |
| Minimum | Nothing smaller than **12px** (product rule) |

Import: `https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap`

## Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Brand h1 | 14px | 600 | White |
| Topbar h2 | 17px | 600 | letter-spacing -0.01em |
| Panel h3 | 14px | 600 | |
| Record h3 | 20px | 700 | Device/ticket title |
| Body / td | 13–14px | 400–500 | |
| th / muted / crumb | 12px | 600 / 400 | ink-3 |
| Fleet total | 34px (28px ≤820) | 700 | |
| Legend b | 22px | 700 | |
| Tile b | 24px | 700 | |
| Mobile inputs | 15px | — | height 46px |
| Buttons | 13px (sm 12px, mobile sticky 15px) | 500–600 | |

## Layout

| Token | Value |
|-------|-------|
| `--rail-expanded` | `280px` |
| `--rail-collapsed` | `64px` (desktop icon-rail) |
| `--rail` | `var(--rail-expanded)`; `html.rail-narrow` → collapsed; `0` on ≤820 with drawer |
| `--r` | `8px` panel radius |
| `--r-sm` | `5px` control radius |
| Page max width | **None** (Phase 13 — `.page` fills shell; was `1360px`) |
| Form / mobile flow caps | Forms often `980px`, mobile flows `580px` where used |
| Page padding | `22px 24px 48px` (≤820: `16px 14px 40px`) |
| Topbar | sticky, min-height `60px`, padding `0 24px` |
| Panel margin | bottom `18px` (grid children: `0`; gap handles spacing) |
| Shell | `margin-left: var(--rail)`; `width: calc(100% - var(--rail))` |

Grids: `.grid-2` 1.25fr/1fr; `.grid-2-even` 1fr/1fr; collapse ≤1080. `.grid-master` 340px/1fr; collapse ≤940. `.tiles` 4-col / `.tiles.five` 5-col; ≤900 → 2-col. `.form-grid` 2-col; ≤760 → 1-col. Fleet `.legend` 4 equal columns (≥1083); 2-col 430–1082; 1-col ≤428.

## Visual styles

| Item | Value |
|------|-------|
| Panel border | 1px `--line`, radius 8px |
| Pill | padding 3px 9px, radius 20px |
| Chip | padding 9px 13px, radius 22px |
| Toast shadow | `0 6px 20px rgba(15,36,56,.28)` |
| Sticky bar shadow | `0 -3px 14px rgba(15,36,56,.07)` |
| Focus | `:focus-visible` 2px teal outline |
| Active nav | inset box-shadow `3px 0 0` teal |
| Reduced motion | disable transitions/animations |

## Breakpoints (original)

| Width | Behavior |
|-------|----------|
| ≤820px | Sidebar off-canvas; menu button; hide `.topbar-actions`; page padding shrink; facts 2-col; collapse toggle N/A (full labels in drawer) |
| ≥821px | Sticky bar offset by rail; desktop expand/collapse toggle |
| ≤760px | Form grid / class-pair stack; filterbar stacks; `.tabs-row` stacks equal-width tabs above search/actions (touch targets; the sliding ink follows the stacked tab widths) |
| ≤900px | Tiles → 2 columns |
| ≤940px | Master grid stacks |
| ≤1080px | `.grid-2` stacks |

## Components (visual)

Fleet strip, ranked bars, filterbar, panels, tables (incl. `.split`), tabs, views switcher, timeline, scanbox, mobile step heads, seg buttons, chips, photo grid, person blocks, util bars, permission matrix, jump pills, hint-strip, reclass strip, device card, sticky-bar, page-toolbar, collapse-filter, modal, tooltip.

## Manual design maintainability

- Map tokens into Tailwind `theme` / CSS variables once.
- Prefer readable utility strings on components over opaque style maps.
- Document any remaining custom CSS classes in `src/index.css` with comments pointing to original section numbers in `style.css`.
- Do not invent new radii, colors, or fonts.

## Unknowns

| Item | Status |
|------|--------|
| Exact Archivo metric rendering across browsers | Needs verification on device |
| Print QR label output | Toast-only in original |
| Real camera scan chrome | Needs verification when implemented |

## Phase 8 — Responsive verification

Signed off in MEMORY.md against the breakpoint table above. CSS lives in `src/index.css` (layout §§3–4, forms §§5, grids, tiles, mobile §§25, sticky-bar, responsive §§14). Drawer Escape/resize close is React-only hygiene; visuals match the original.

## Phase 11 — Auth UI states

Reuse AuthLayout + Panel + Field + `.hint-strip` / `.auth-error` (no new visual system).

| State | Pattern |
|-------|---------|
| Pending signup success | Hint strip: wait for Admin or Project Manager approval; link to login |
| Login Pending error | `.auth-error`: "Please ask the admin to approve your request." |
| Forgot password | Email field → generic success message (no account enumeration) |
| Reset password | Token from query + new password (+ confirm in UI) |
| Admin change password | Modal on Users; toast on success |
| Pending users | Pill tone warn/grey; **Approve** action when status is Pending |

## Phase 12 — Sidebar layout

| Item | Value |
|------|-------|
| Expanded width | `--rail-expanded: 280px`; brand height = `--topbar-h` |
| Collapsed width | `--rail-collapsed: 64px` |
| Width transition | ~0.38s cubic-bezier on `.rail` width + `.shell` margin/width |
| Label hide | `.nav-label` / `.brand-text` / `.rail-foot` opacity + overflow (no hard unmount) |
| Nav icon | 16×16, stroke 1.6, `.ico` |
| Active | inset `3px` teal; background `--navy-2` |
| Settings | Bottom utility above EXILIO / version divider |
| Branding | Teal `P` glyph + `APP.nameLines` / `APP.sub`; glyph only when collapsed |
| Collapsed tooltip | Native `title` + `aria-label` |

## Phase 13 — Shell / Settings / dashboard UX

| Item | Pattern |
|------|---------|
| Page width | Full shell; no `1360px` max |
| Logout | Topbar icon (`.who-logout`); Modal confirm; Cancel then Log out, right-aligned (`.modal-actions`) |
| Tooltip | `.tooltip` + `.tooltip-bubble` (navy); hover/focus-within |
| Fleet legend | Short labels only; tip text in Tooltip; 4 equal columns |
| Panel foot | `.foot-note { margin-top: auto }` inside flex column panels in `.grid-2` |
| Settings | Two content-sized panels (`.settings-grid`); Password form asks for current password; actions in `.settings-actions` at form foot |
| Landing filters | `.page-toolbar` / JumpLinks `actions` / panel-head / `.collapse-filter` — not topbar |

## Phase 14 — Raise ticket + field action bars

| Item | Pattern |
|------|---------|
| Raise steps | 1 device + 2 problem only; remove assign/priority panel |
| Reported by | Not displayed; backend derives the reporter from the signed-in session |
| Problem field order | Photos first, then **What is happening** |
| Photo add | Compact `.photo-add` 86×86 dashed tile (original preview) |
| Action bar | `.sticky-bar { position: static }` — scrolls with page, not viewport-fixed |
| Action width | `.sticky-bar-inner { max-width: 580px }` matches `.mobile` |
| Action chrome | Transparent background; no full-bleed white footer / top border / shadow |
| Shared on | Raise, Update, Close ticket pages |

## Phase 37 — Multi-issue rows

| Item | Pattern |
|------|---------|
| Issue rows | One category per row; multi-select sub-categories as chips; used categories hidden on Add another |
| Issue rows | Update starts with a blank selectable category/sub-category row; no reported/found prefill; Sub-category renders on a new line |
| Detail multi | Group by category under As reported / As found (category header + sub list from `issuesReported` / `issuesFound`) |
| Site attendant | Sync + Issue Master via permissions; Parts still role-hidden |

## Phase 15 — Ticket visibility (UX notes)

| Item | Behavior |
|------|----------|
| Ticket list (when API-wired) | Backend returns only authorized tickets; empty list uses existing empty-state |
| Users Approve | Visible when session has Users `e` (Admin or Project Manager) |
| Roles matrix | Live `GET/PATCH /api/roles`; PM Roles `v` only (no edit) |
| Roles delete | Danger button + confirm `Modal` when Roles `d`; a role held by an Active or Pending account is refused by the backend and the row stays, with the `ROLE_IN_USE` message in the toast. Inactive accounts never block it |
| Role-less account | Role column shows "No role — select one"; Edit refuses Active until a role is chosen |
| User delete | Danger button + confirm `Modal` when Users `d`; permanent removal, offered on every row including Inactive |

## Phase 16 — FE ticket/dashboard API binding

| Item | Pattern |
|------|---------|
| TicketList | `listTickets` → tiles / tabCounts / rows from API; loading/empty/error like Users |
| Dashboard | `getDashboard` → fleet / downReasons / roadStatus; filters refetch |
| TicketDetail | `getTicket(id)` → header/history; 403/404 hint-strip |
| Security | No client-side “hide unauthorized rows” as the access control |

## Phase 17 — QR scan UI

| Item | Pattern |
|------|---------|
| Scan button | Opens `QrScannerModal` for any signed-in user |
| Device card after scan | QR Number, Slot Id, Slot Label, Slot Identifier, Parking Location, Status, Open ticket (+ lat/lng when present) |
| Raise with open ticket | `.reclass` banner; disable Raise; Open / Update existing ticket → `/tickets/:id` |
| Free device Raise | Step 2 problem form; issue UUID selects; live `POST /api/tickets` then optional photo attach |
| Loading | “Fetching device…” while `resolveScan` runs; Raise disabled while resolving/submitting |
| Scan API error | Toast + clear device; do not offer Raise |
| Update after scan | Live resolveScan; open ticket → Detail CTAs; free → Raise CTA; miss/error EmptyState |
| Scan QR page | Removed — use Raise / Update Ticket camera or typed QR instead |

## Phase 18 — Home, status, Raised by

| Item | Pattern |
|------|---------|
| Post-login home | Admin / Project manager → Dashboard; others → All tickets |
| Dashboard nav | Hidden for non–Admin/PM (even if Dashboard permission `v` exists) |
| All tickets nav | Site attendant / Technician: top-level **All tickets**; other roles: Tickets → All tickets / Work report |
| All tickets icon | Shared `ticket-list`: ticket stub with list lines (same for all roles; distinct from Tickets parent stub and Work report clipboard) |
| Ticket tabs | Labels **Open** / **Under Repair** / Closed, tab ids `open` / `urp` / `cls` (Phase 52; Assigned tab removed in Phase 51) |
| Status pill | Never show **New**; show **Open** (same tone as before) |
| Table columns | … Issue found → **Raised by** → Updates … (Assigned to removed in Phase 51) |
| Updates count | Only `visit_open`, `visit_resolved`, `waiting_spare`, and `reclassified` events from Update Ticket; no actor-role filter |

## Phase 19 — List columns, Add Update modal, trail images

| Item | Pattern |
|------|---------|
| Open / Under Repair tab table | Updates + Days open (Phase 52: Open = no update yet, Under Repair = at least one update) |
| Closed tab table | **Days After Close** instead of Days open |
| Summary tiles | From the API; Under repair counts historical assigned+Open via `listStatus` |
| Add Update | `Modal` wide; same form; Cancel / Escape / overlay close |
| Work history | Always visible; oldest first; newest at bottom |
| Photos | Text **View Update** (always) + **View Image** when photos exist (no inline imgs) |
| View Update | `Modal` with trail fields only — no image preview |
| View Image | `ImagePreviewModal` main + thumbs; Zoom in/out / Reset / Rotate; desktop hover pointer zoom; pinch + pan on touch |
| Pan / explore | Hover or pinch sets zoom; drag pans; `touch-action: none` on stage |
| Reset | Thumbnail change or Reset control clears zoom + rotation + pan |
| Back to tickets | Restores list tab via `state.from` (`/tickets?tab=…`); crumb matches |

## Phase 20 — Image attachment in ticket

| Item | Pattern |
|------|---------|
| Add photo control | Compact tile; menu: Choose from folder / Capture from camera |
| Folder | Hidden `input type=file accept=image/* multiple` |
| Camera live | `CameraCaptureModal` + `getUserMedia`; video fills mount |
| Flip control | Circular overlay on preview (`.camera-flip-btn`): camera outline + circular arrows SVG; top-right desktop, bottom-right ≤520px |
| Camera actions | **Cancel** + **Take photo** only (one equal-width row) |
| Crop / review | Drag box + corner handles; sticky **Cancel** / **Recapture** / **Upload** |
| Crop layout | Image fits viewport (`max-height` + `object-fit: contain`); transparent stage — **no black letterbox**; larger handles on mobile |
| Preview thumbs | Local object-URL in `.photo-thumb.has-img`; × removes one; count `N of 5` |
| Cap | Max **5** photos; Add tile hidden at limit |
| Upload timing | Parent `uploadImages` on form submit — not per-file on add; Raise/Update attach after create/update succeeds |
| CSS | `.photo-source-menu`, `.camera-capture-*`, `.camera-flip-*`, `.camera-crop-*` in `index.css` |

## Phase 21 — Sidebar alignment, pagination, PhotoPicker/modal, live Add Update

| Item | Pattern |
|------|---------|
| Field wrapper | `div.fld` (not `<label>`) — avoids label-activating first photo × |
| Photo remove | Revoke only the removed object URL |
| Ticket Update | No Hand over / Next visit planned; Photos before Work done / Work done today |
| Collapsed rail | Brand glyph + nav icons centered in `--rail-collapsed` (64px); brand height = `--topbar-h` |
| Expanded rail | `--rail-expanded: 280px`; single-line title |
| Shell / topbar | Topbar inside `.shell`; width follows `--rail`; menu X held through collapse animation |
| TicketList pager | `.table-pagination` Card Minimal right: Page X of Y + N per page left; Previous / Next right; one row at all widths (≤560: tighter gap, Prev short label, content-sized select) |
| Limit options | 10 / 25 / 50 / 100 (default 25) |
| PhotoPicker in modal | Source menu + camera portaled to `body`; hidden folder input; Add photo leftmost when empty |
| Raise save | `POST /api/tickets` (photos `[]`) → `uploadImages` → `PATCH …/raised/:eventId/photos` |
| Add Update save | `POST /updates` → `uploadImages` → `PATCH …/photos`; button needs Update-ticket `e` |

## Phase 22 — Responsive skeleton loaders

| Item | Pattern |
|------|---------|
| Primitive | `.sk` block with shimmer; tokens `--line` / `--hover` / `--panel` |
| Reduced motion | `animation: none` under `prefers-reduced-motion: reduce` |
| TicketList | `SkeletonTiles` (4) + `SkeletonTable` in panel body |
| TicketDetail | Record + facts + `grid-2` panel skeletons |
| Dashboard | Fleet strip + `grid-2` panel skeletons (filters stay visible) |
| Users | Tiles + table skeleton |
| Auth boot | Minimal brand-width bars in `.auth-boot` |

## Phase 23 — Parts & visit cost

| Item | Pattern |
|------|---------|
| PartChips | Update uses a searchable dropdown; selected parts appear as removable tags with **×**; dropdown options remain multi-select |
| Parts gate | One **Parts were changed** radio with a single **Yes** option; only selected reveals parts and labour fields |
| Field order | Searchable parts dropdown → selected tags → **Labour / other charges** → Parts total |
| Loading / empty / error | Muted line in chip row; no hardcoded live fallback |
| Cost field | Label **Labour / other charges**; hint that part prices are server-added |
| Selected parts hint | Optional display-only sum of master amounts (not sent as `cost`) |
| Cost summary | **Parts Total** + optional **Labour / other charges** + **Total Amount**; labour cannot be negative |
| After save | Toast uses backend `cost`; trail lists part snapshot names |
| Masters nav | Child labels **Issue** / **Road** / **Parts** (group **Masters** unchanged) |
| Parts icon | Interlocking gear cluster in `NavIcons` `parts` (not bolt; distinct from Settings) |

## Phase 24 — Image viewer zoom/rotate + Trail View Update

| Item | Pattern |
|------|---------|
| Trail actions | `.tl-trail-actions`: **View Update** (always) then **View Image** (when photos) — `linkish` |
| View Update modal | Standard `Modal`; `.view-update-facts` label/value rows; long text wraps |
| View Update content | When, By, Update type, Status, What was done, Parts, Cost, Next visit — skip empty; **no images** |
| Image controls | Below main image, above thumbs: `.img-preview-controls` + `.img-preview-ctrl` (40px tap) |
| Zoom | Scale 1 → 3 step 0.25; Zoom out disabled at 1; Zoom in disabled at 3; desktop hover enters ~2.25 toward pointer |
| Pan / explore | Hover or pinch sets zoom; drag pans; `touch-action: none` on stage |
| Rotate | +90° CSS rotate; wraps at 360; `.is-sideways` caps for 90/270 fit |
| Containment | `.img-preview-main { overflow: hidden }`; transform-origin follows pointer; pan clamped to stage |
| Reset | Thumbnail change or Reset control clears zoom + rotation + pan |
| Icons | Inline SVG stroke icons + native `title` / `aria-label` (no new icon lib) |
| Reduced motion | No transform transition under `prefers-reduced-motion` |

## Phase 32 — Master delete + mobile crop

| Item | Pattern |
|------|---------|
| Part deactivate | Confirm Modal → `PATCH` `{ active: false }`; Issue `e` or Technician |
| Issue list | Live `GET /api/issues`; usage90d for Delete vs Deactivate label |
| Issue sub remove | Confirm → `DELETE` or deactivate; 409 IN_USE → deactivate |
| Crop stage | `max-height: min(55dvh, …)`; sticky review actions; ≥28px handles ≤640px |

## Phase 34 — Issue create + category delete

| Item | Pattern |
|------|---------|
| Create category | Inline form → `POST /api/issues/categories` `{ name }`; Issue master `c`; min 2 chars |
| Create subcategory | Inline form → `POST /api/issues/subcategories` `{ categoryId, name, severity }`; keep selected category |
| Category delete | Trash icon → confirm → `DELETE /api/issues/categories/:id` (`d`); 409 → `PATCH active:false` if `e` |
| Busy | Disable create/delete controls while request runs; toast via `toastApi*` |

## Phase 35 — Users role hierarchy dropdown

| Item | Pattern |
|------|---------|
| Hierarchy | Admin → Project manager → Control room → Engineer → Technician → Site attendant → AMC officer |
| Create/Edit role select | `filterAssignableRoles(user.role, roles)` — same-or-below only |
| Gates | Still require Users `c` / `e`; empty assignable disables create |
| Edit PATCH | Omit `roleId` when unchanged (avoids 403 on higher-role rows) |
| Matrix | Roles tab live via `/api/roles` (Phase 36); hierarchy dropdown unchanged |

## Phase 44 — Users visibility + account delete

| Item | Pattern |
|------|---------|
| Visibility | Render the API payload as-is — no client-side `row.id` / `row.role` filter |
| Own account | Absent from the API response, so no self row and no self-delete control |
| Delete button | `canPerm(user, 'Users', 'd')` (Admin only) + `row.status !== 'Inactive'` |
| Style | `Button size="sm" variant="danger"` in the existing `td.act`, same as Edit/Password |
| Confirm | Existing `Modal` (title “Delete user?”), names the user, `closeDisabled` while busy |
| Busy state | `deleting` flag → button reads “Deleting…”, Cancel and close gated |
| Success | `toastApiSuccess` then `await refreshUsers()` — no page reload |
| Failure | `toastApiError(err, 'Could not delete user.')`; row stays in the list untouched |
| Semantics | Deactivation, not removal — the row remains as `Inactive`, so Delete hides on it |
| Foot-note | Restated: delete deactivates, self-delete is impossible, PM sees no Admin accounts |
| Removed | `row.you` marker (nothing can be “you” in your own list) |
| Row actions | Edit/Password keep the `canEdit` gate; the muted `—` now shows only when neither `e` nor `d` |

## Phase 25 — Forgot password role gate + 404

| Item | Pattern |
|------|---------|
| Forgot note | Muted copy: Admin / Project Manager only |
| Role deny | `.hint-strip.auth-error` shows API message (`FORGOT_PASSWORD_ROLE_DENIED`) |
| Success | Unchanged generic “check your email” strip for Admin/PM / unknown |
| 404 shell | `.not-found-shell` / `.not-found-inner` centered on `--bg` |
| Gear animation | `.gearbox` transparent; gears `--navy-2`/`--navy-3`; hub ring `--teal`; no black panel |
| Motion | Clockwise / counter-clockwise; paused under `prefers-reduced-motion` |
| CTA | Primary button → `homePathForUser` or `/login` |

## Phase 39 — New-ticket notifications

| Item | Pattern |
|------|---------|
| Browser control | Inline bell in the topbar; stays visible when `.topbar-actions` is hidden on mobile |
| Notification list | Small anchored popover with latest backend rows, unread dot, ticket reference, message, device/issue/raiser context, and time |
| Permission state | Explicit Enable / Turn off action; denied and unavailable states explain browser/deployment limits without repeated prompts |
| Sound | Play the bundled achievement MP3 on a new push/count increase, including an open background tab; debounce duplicates and tolerate autoplay blocking |
| Sidebar count | Same backend unread count on Tickets parent and All tickets child; hidden at zero, capped visually at `99+` |
| Read state | Mark one read from the item; Mark all read uses `PATCH /api/notifications/read-all` |
| Read on open | Opening `/tickets/:ticketId` marks that ticket's notifications read via `POST /api/notifications/ticket/:ticketId/read`; badge and list update in place, no refresh |
| Assignment alerts | Historical `ticket.assigned` / `ticket.reassigned` rows still render in the same popover; none are created since Phase 51 |
| Attribution | "Raised by …" for `ticket.raised`; "Assigned by …" for assignment types; line omitted when the payload has neither |
| Navigation | Uses backend `data.url` only when `canOpen`; opens existing `/tickets/:ticketId` and preserves the Open tab return path |
| Responsive | Popover becomes a fixed 14px-inset panel below the topbar at ≤820px |
| Colors | Teal unread accents, `--info-bg` permission strip, existing danger badge for counts; no new palette |
| Accessibility | Bell/menu labels include unread count; Escape/outside click close the popover; unread items expose state text |

The notification UI is an authenticated-shell addition; it does not add a new menu destination or replace the existing Toast system.

## View Update issue details

| Item | Pattern |
|------|---------|
| Issue context | Show Reported issues / Issues found section only when the event has issue data |
| Multiple issues | Group each issue category in its own bordered card; show all sub-categories as readable chips |
| Summary | Show clear category/sub-category counts while keeping multiple issues grouped |
| Empty/fallback | Hide the issue section when no issue exists; use legacy scalar category/sub-category fields for older events |
| Scope | Details remain in View Update; photos remain in View Image |

## Phase 26 — Device Sync

| Item | Pattern |
|------|---------|
| Sync button | JumpLinks `actions`, left of Add device; `btn-dark` + inline sync SVG; label **Sync Devices** |
| Syncing | Same button disabled; label **Syncing...**; rest of page usable |
| Visibility | `canPerm(user, 'Device list', 'c')` — Admin, PM, Technician, Engineer |
| Toast | Start / complete / fail via existing `toast()`; on complete show `Created` / `Updated` / `Skipped` from `run.stats` (`devicesCreated` / `devicesUpdated` / `devicesSkipped`) when present |
| Table columns | Slot Id, Slot Label, Slot Identifier, QR Number (`.code` → history), Parking Location |
| Empty cell | `—` for null identifier / missing values |
| Skeleton | `SkeletonTable` 5 cols |
| Responsive | Existing `.jump-actions` wrap; `.table-wrap` horizontal scroll — no new breakpoints |
| Status tiles | Buttons (`.tile-link`); click → `selectStatus` (Working / Under repair / Not working / All for Total); `aria-pressed` + `.tile-selected` when matches `applied.status`; stay on `/devices` |

## Phase 26b — Ticket Slot Id + live Device history

| Item | Pattern |
|------|---------|
| Ticket list column | **Slot Id** (was Device); link `/devices/{deviceId}` |
| Ticket detail subline | `Slot Id {id}` + road + Slot label |
| Device history | Live `getDevice(routeId)`; header title = Slot Id / fallback; skeleton while loading |
| Work report (day) | Column header **Slot Id**; live rows from API |

## Phase 30 — Work report live API

| Item | Pattern |
|------|---------|
| Load | `GET /api/reports/work?view=&from=&to=&person=&road=` via `getWorkReport` |
| Dates | From/To enabled only for Date range view; Day/Week/Month omit dates (backend defaults) |
| Person / Road | Lookups: technicians `name`, roads `name`; sentinels Everyone / All roads omitted |
| Export | `GET /api/reports/work/export` → CSV download (`work-report.csv`) |
| Auth | Page `canPerm(user, 'Work report', 'v')`; else Navigate home |
| Empty / loading | EmptyState when no people; SkeletonTable while first load |
| Add / Edit device | Form fields: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location; Edit via `/devices/add?id=` |

## Phase 44 — Slot Label order and Assign dropdown role filter

> The Assign dropdown rows below are history — assignment was removed in Phase 51.

| Item | Pattern |
|------|---------|
| Device list order | No frontend sorting. `GET /api/devices` orders Slot Label ascending in SQL, so order is already correct across pages |
| Assign dropdown source | Unchanged: `listTechnicianLookups()` → `GET /api/lookups/technicians` (returns `role` per row) |
| Assign dropdown filter | `filterAssignableAssignees(techOptions, currentAssigneeId, currentAssigneeName)` from `services/users.js`, with `ASSIGNABLE_ASSIGNEE_ROLES = ['Technician', 'Engineer']` |
| Current assignee | Always kept in the option list, even when its role is not assignable, so an existing Control room / Project manager holder still shows their selection and can be reassigned away |
| Work report | Person filter keeps the full lookup (Control room / Project manager are valid report actors) |
| Authorization | Unchanged — `canPerm(user, 'All tickets', 'a')` in the UI, `authorize('All tickets', 'a')` + `assertEligibleAssignee` on the server |

## Phase 27 — QR → device → raise / update

| Item | Pattern |
|------|---------|
| Scan resolve | `resolveScan`: sticker `qr_token` → `POST /api/devices/slot-mac`; legacy → `GET /api/devices/scan?q=`; “Fetching device…” while in flight |
| Device facts | QR Number, Slot Id, Slot Label, Slot Identifier, Parking Location, Status, Open ticket |
| No open ticket | Raise step 2; issue UUID selects; Raise → `POST /api/tickets` → upload → `PATCH …/raised/:eventId/photos` |
| Open ticket | `.reclass`; no Create; primary **Update Ticket** → `/tickets/update` (`ticketId` + `qr`); secondary Open → Detail |
| Create conflict | Toast from `details.issues` (one ticket → navigate to Update Ticket; several → name the duplicates) + refresh scan (Phase 50) |
| Scan miss / error | EmptyState; error does not allow Raise |
| Camera | Existing `QrScannerModal`; permission error inside modal |
| Mobile | Existing `.page.mobile` Raise layout; scanner modal wide |
| Update Ticket (`/tickets/update`) | Live scan or `?ticketId=`; Closed refused (no assignee gate since Phase 51); **Add Update form on page**; free → Raise (+ `qr`) |
| Manual QR Number | Raise/Update: scan or type QR Number only (no Road/Slot selects); Find device → `resolveScan` |
| Detail actions | Update ticket `v`+`e` and not Closed → **Add update** + **Resolve** (Modal) — Phase 51 |
| Assign / Reassign | Removed in Phase 51 |

## Phase 28 — QR lookup → Update Ticket

| Item | Pattern |
|------|---------|
| Raise open ticket | Primary button label **Update Ticket** (not Raise) |
| Preload | `?ticketId=` + optional `state.qr` / `from` |
| Ticket check | `getTicket` → Closed → toast "That ticket is closed…"; anything else opens the form (Phase 51) |

## Phase 29 — Update form on Update page

| Item | Pattern |
|------|---------|
| Route | `/tickets/update` (plural; not `/ticket/update`) |
| Form | Shared `TicketAddUpdateForm` inline (not Detail redirect) |
| Ready | After gate, form visible — no second Update click |
| Detail | Trail/history unchanged; Modal Add Update for anyone with Update ticket `e` |

## Phase 47 — Raise roles, optional assign, Resolve, Close with update

> Raise **Assign to**, the unassigned-update hint strip and the Admin/PM **Assign to** select were removed in Phase 51; the rest stands.

| Item | Pattern |
|------|---------|
| Raise roles | Technician / Engineer / Electrician via `Raise ticket` `c` (backend matrix) — no role-name gate |
| Raise Assign to | Optional `<select>` in step 2 after "What is happening"; first option **Assign later**; only with All tickets `a`; no required marker |
| Unassigned update (field role) | QR page `.hint-strip`: "This ticket has no assignee. Saving will assign this ticket to you."; Detail Add update visible |
| Unassigned update (Admin/PM) | Required **Assign to** select in the form row after Visited by / Date |
| Form order | Visited by + Date → (Assign to) → Issues → Parts → Photos → What was done today → **Update type** → **Close Ticket** → footer hint |
| Close Ticket | Yes / No radios using `.update-parts-choice` / `.update-parts-choice-option` (42px min-height, wraps on mobile); default **No**; directly after Update type, above the footer hint |
| Footer hint | "The ticket stays open unless Close Ticket is set to Yes." |
| Resolve | Secondary button beside **Add update** on Detail; same Modal titled **Resolve ticket**, update type preset `Site visit — resolved`, Close Ticket still **No** |
| Success toast | "Update saved and ticket closed." when the response has `closed`; otherwise "Update saved." (+ visit cost) |

## Phase 49 — Per-issue Open/Resolved

| Item | Pattern |
|------|---------|
| Form order | Visited by + Date → (Assign to) → Issues (found on site) → **Resolve issues** → Parts → Photos → What was done today → Update type → Close Ticket → footer hint |
| Resolve issues | `Field` with existing `.chip-row` / `.chip` / `.chip.on` toggles (`aria-pressed`), label `Category › Sub`, multi-select; hint "Tap every reported issue this update resolves. Only open issues are listed." |
| No open issues | Muted line "No open issues left to resolve on this ticket." (+ " Set Close Ticket to Yes when the work is finished." with Update ticket `x`) |
| Detail "As reported" | Each sub-category followed by `Pill` — `ok` **Resolved** / `bad` **Open**; "As found" has no status |
| View Update | "Resolved issues" fact row (`Category › Sub, …`) after the issue cards, only when the event resolved something |
| Close page | `.hint-strip` above the close form: "Closing will mark N open issue(s) resolved." |
| Dashboard | "Why devices are down" rows = Open reported issues; subtitle "N open issues across M open tickets · grouped by issue" |

## Phase 50 — Several open tickets per device

| Item | Pattern |
|------|---------|
| Raise open-tickets block | Existing `.reclass` under the DeviceCard. Heading "This device already has an open ticket." / "… has N open tickets." + "Same problem? Update that ticket. Different problem? Raise a new ticket below." One row per ticket: **TK-xxxx** · raised N days ago · Open issues: Motor failure, … then `btn btn-sm btn-primary` **Update Ticket** + `btn btn-sm` **Open TK-xxxx** |
| Raise step 2 | Always shown once a device is found (no device-level hide); Raise button enabled |
| Same-issue toast (one ticket) | warning "Motor failure is already open on TK-1042. Add an update to that ticket instead." → navigates to Update Ticket |
| Same-issue toast (mixed / several tickets) | warning "Already open on TK-1042, TK-1050: Motor failure, Display blank. Remove them to raise the rest, or update the existing ticket." — stays on Raise |
| QR Update header | 0 → "Device found"; 1 → "Open ticket on this device" + "TK-xxxx · raised N days ago"; >1 → "Open tickets on this device" + "N open tickets for different issues — pick the one to update" |
| QR Update pick list | Same `.reclass` row layout as Raise; primary `Button size="sm" variant="primary"` **Update this ticket** (→ `activateTicket`), secondary **Open TK-xxxx**; footer "Different problem? Raise a ticket for a different issue" (`.link` → `/tickets/raise` with `qr`) |
| DeviceCard fact | "Open tickets: TK-1 — Motor failure (2 days); TK-2 — Sensor failure (now)" (label singular for one ticket) |

## Phase 51 — Main/Sub issue panels and no assignment

| Item | Pattern |
|------|---------|
| Form order | Visited by + Date → **Reported Issues** (labelled "Resolve Issues" until Phase 52) → Parts → Photos → What was done today → Update type → Close Ticket → footer hint (no Assign to, no found-on-site rows) |
| Visited by | Required select of active field staff ("Name (Role)") for **every** user (Phase 52; was Admin/PM only, locked to self for others). Field staff start on themselves and may pick someone else; others start on "Select who visited" |
| Reported Issues field | `Field` label "Reported Issues" (Phase 52), hint "Tick a main issue to resolve all its open sub issues, or tap single sub issues. Use Add another issue for a new problem found on site." (Phase 52) |
| Panel | `.issue-panel` — every raised Main Issue listed at once, expanded by default (Phase 52; was collapsed in Phase 51), still collapsible — with `.issue-panel-toggle` header "Issue N · {Main issue}" + `Pill` (`bad` "N open" / `ok` "Resolved") + chevron (`.chev`, rotates when `.open`); body `.issue-panel-body` |
| Main issue row | `.issue-main-check` checkbox "Main issue: {name} — resolves all N open sub issues" (or "— already resolved", disabled `.is-disabled`) |
| Sub issues | Existing `.chip-row` / `.chip` / `.chip.on`; Resolved → `.chip.is-resolved` + " · Resolved", disabled; when the main is ticked, subs show on + disabled |
| Another Issue | Removed in Phase 52 — all raised issues are listed at once |
| View Update → resolved issues | `.view-update-resolved` green card (Phase 52 follow-up): round check icon, "Fixed in this update" + "N issue(s) resolved", then one white row per main issue with `✓ sub` chips (`--ok` / `--ok-bg`). Replaces the plain "Resolved issues: Category › Sub" text. The "Status" row is labelled **Ticket status** so "Still open" is not read as the issue status |
| Issue classification card | Phase 52 follow-up: "AS REPORTED" / "AS FOUND" small-caps labels; per category `.issue-group-head` (name + "N/M resolved", `--ok` when all resolved); each sub issue a white bordered `.issue-row` with label (`flex: 1`, wraps) and pill pinned right; resolved rows mute the label. Empty side → dashed `.issue-empty` "Not inspected yet" + "Shows here once a technician records what was found on site." `.ticket-detail-class` is `container-type: inline-size`; `@container (max-width: 480px)` stacks `.class-pair` (border moves to top) |
| Record header (Ticket detail + Device history) | `.record-top` > `.record-head` (`flex: 1 1 280px`) with `.record-title` (h3 + status `Pill`, wraps) and `.sub` (`.sub-part` keeps "Slot …" together); `.push` actions right-aligned and wrapping. ≤760px: `.record` padding 16px, `.push` full width, buttons `flex: 1 1 auto` (Close ticket drops to its own full-width row on ≤375px) |
| Ticket detail mobile order | ≤1080px (stacked): Issue classification → Work history → This device before today (Phase 52 follow-up; `.ticket-detail-grid`, right column `display: contents` + `order`). Desktop keeps Work history left, Issue classification + device history right |
| Resolved issues | Hidden in Resolve Issues (Phase 52 follow-up): fully resolved Main Issues and Resolved sub chips are not rendered; numbering covers only Open groups; all resolved → muted "Every raised issue is already resolved. Use Add another issue if you found a new problem." |
| Add another issue | `Button size="sm"` in `.resolve-issues-actions`, always shown below the raised issues (Phase 52); opens `.resolve-issues-add` "New issues — added to this ticket as Open" with `TicketIssueRows` ("Select issue category", its own "Add another issue" row button) + **Remove** |
| Order | Raised issues first (Issue 1…N), new issues after — raised work is the focus |
| Conflicts | `ISSUE_ALREADY_RESOLVED` / `ISSUE_ALREADY_ON_TICKET` / `OPEN_TICKET_EXISTS` → toast + reload the ticket (panel resets collapsed) |
| Ticket Detail | No Assign / Reassign button or Modal, no "Assigned to" fact |
| All Tickets | Tabs Open / Closed; crumb "N open · M closed"; no assignee filter / column; action cell = **Open** link; Open tab subtitle "Every ticket not closed yet — anyone with update access can work on it" |
| Raise / Update / Close | No Assign to, no assignee hint strips, no "Assigned to" fact |
| Dashboard | "Under repair" tooltip reads "Work in progress" |

## Phase 52 — Under Repair tab, clickable cards, tab transition

| Item | Pattern |
|------|---------|
| Tabs | **Open** (count) → **Under Repair** (count) → **Closed** (count); supersedes the Phase 51 Open / Closed row above |
| Panel copy | Open: "Open tickets" / "Raised, waiting for the first update"; Under Repair: "Under repair" / "Tickets with at least one update — still being worked on"; Closed unchanged; while the age filter is on the subtitle adds " · raised more than 3 days ago" |
| Crumb | "N open · M under repair · K closed" |
| Status filter | Only on Under Repair: All under repair / Under repair / Waiting for spare. Hidden on Open and Closed |
| Summary cards | `button.tile-link` around `Tile` (Device list pattern); selected → `aria-pressed="true"` + `.tile-selected` (teal border + ring); disabled while loading. Skeleton only on first load |
| Card → view | Open, not attended → Open; Under repair → Under Repair + "Under repair"; Waiting for spare → Under Repair + "Waiting for spare"; Open over 3 days → age filter, Open tab if it has any such ticket, else Under Repair (badges show the over-3-days split) |
| Tab ink | `.tabs-ink` 2px teal bar under the active tab; slides with `transform` / `width` 240ms `cubic-bezier(0.4, 0, 0.2, 1)`; no transition on first placement. Replaces the static `border-bottom-color` on `.tabs button.on` (all `Tabs` users) |
| Panel slide | Panel keyed by tab; `.tab-pane-next` / `.tab-pane-prev` animate head + body from `translateX(±18px)` + opacity 0, 240ms; panel `overflow-x: clip` so no horizontal scrollbar |
| Reduced motion | `prefers-reduced-motion: reduce` → no ink transition, no panel animation |

## Phase 53 — Slot View

```text
Sidebar: Dashboard · Slot View · Tickets ▸ · Devices · Masters ▸ · Users

/slot-view                                  /slot-view/:slotId
[Search  Slot Id, slot label or road] Reset Apply    ← Back to Slot View
Slots with tickets                          Slot 3-12            (record header)
Slot Id │ Slot Label │ Road    │ Tickets │   Slot Label · Slot Id · Road · Tickets · Unresolved issues
6520    │ 3-12       │ CG Road │       1 │ Open   Unresolved issues
…                         Page 1 of 8 ‹ ›     Communication                 1 open
                                              [Communication module faulty  TK-1103  (Open)]
                                            Tickets   (All tickets table, no Slot columns, Days open)
```

| Item | Pattern |
|------|---------|
| Sidebar | `Slot View` with the `slot` NavIcon (parking bays + marker), top-level, directly after Dashboard; highlighted on `slot-view` and `slot-detail` pages; hidden without `Slot View` v (Admin + Project manager by default, toggled per role in Roles & permissions) |
| Slot list | Existing `FilterBar` + `Panel` + `.table-wrap` table + `TablePagination`; Slot Id and Slot Label are both `.code` links to the same detail; Tickets is a `.num` column; Slot Id / Label cells never wrap (`.slot-table .slot-cell`) |
| Slot list empty | `EmptyState` "No tickets raised yet" (no search) or muted "No slots match this search." |
| Slot header | Reuses `.record` / `.record-head` / `.facts` (5 facts; 2 columns on small screens) — same card as Ticket / Device detail |
| Unresolved issues | Reuses the Ticket Detail issue styles: `.issue-groups` → `.issue-group-head` (Main Issue, "N open") → `.issue-row` (Sub Issue label, ticket links in `.slot-issue-tickets`, red `Open` pill). Row wraps at ≤560px |
| No unresolved issues | `EmptyState` "No unresolved issues" |
| Tickets | Shared `TicketTable` (same markup as All tickets) without Slot Id / Road columns; Days open column for every status; empty row "No tickets raised for this slot yet." |
| Loading / errors | `SkeletonTable` / `SkeletonText` in a `.record`; inline `.hint-strip.auth-error` ("Slot not found.", "You do not have access to this slot.") |
| Ticket Detail from a slot | Back link "← Back to slot", crumb "Slot View › …" |


