RULES.md — Project Rules
What to do
Preserve original UI, spacing, typography, colors, and interactions.
Preserve all existing screens and flows unless the user explicitly drops them.
Treat original HTML/CSS/JS as visual/behavioral source of truth.
Treat product skill / Claude scope as product-rule source of truth when they constrain fields, menu, and statuses.
Reuse assets and inline SVG paths from the original.
Prefer reusable React components only when the same pattern appears on multiple pages.
Use Tailwind utilities for most styling; map CSS variables into the Tailwind theme.
Keep custom CSS for cases Tailwind cannot match cleanly (pseudo elements, split-table group headers, scan frame line, tooltips, etc.).
Prefer conventional React: props, local state, simple hooks, React Router.
Keep logic next to the page that uses it.
Name files after screens (TicketList.jsx, not TicketsContainerView).
Validate each migrated page against the original HTML side-by-side (except deliberate, documented deviations).
Update MEMORY.md when finishing a phase or making a decision.
Keep documentation (PR, ARCHITECTURE, RULES, DESIGN, PHASES, SKILLS) accurate.
Leave parking_maintenance (original path) read-only.
Frontend content & file change rules
These rules apply to the React + Vite frontend.
When you create, modify, rename, move, or delete frontend code, content, screens, components, routes, assets, or configuration, review all related content/documentation files and update them when the change affects their accuracy.
Do not leave documentation, content files, phase notes, design notes, architecture notes, skills, or other project reference files describing behavior that no longer exists.
When adding a new screen, component, route, feature, content section, or user-facing behavior, update the appropriate project content/documentation file if one exists for that area.
When changing or removing an existing screen, component, route, feature, content section, or user-facing behavior, update or remove the corresponding content/documentation entry so it remains synchronized with the React + Vite implementation.
When deleting or renaming a file, search for references to that file/path and update all affected references before considering the change complete.
When changing user-facing copy, labels, statuses, navigation names, help text, or other content, update the corresponding content/source-of-truth file rather than leaving stale copies elsewhere.
When creating or changing content that has a documented source of truth, update the source-of-truth content file instead of creating a conflicting duplicate.
If a change requires a new content file, create it in the appropriate existing project structure and document its purpose when necessary.
If a content file becomes obsolete because its related feature/file was deleted, remove it only when it is no longer referenced or required.
Before finishing a frontend task, verify that implementation files and their related content/documentation files are consistent.
Do not update unrelated documentation or content files merely to make changes appear complete; keep updates targeted to the actual change.
If it is unclear which content/documentation file is the source of truth, inspect the existing project structure and references first. Mark uncertainty as Needs verification rather than guessing.
Never modify the original parking_maintenance source tree to synchronize content or documentation; all React + Vite frontend changes must remain in the migrated project.
Sidebar rules (Phase 12+)
Preserve existing MENU routes, active pageId matching, and group expand/collapse.
Keep Settings as a bottom utility (not inside MENU); route is /settings.
Desktop collapse (railCollapsed) must stay separate from mobile drawer (railOpen).
Reuse NavIcons — do not add an icon library.
Prefer local useState in AppLayout for rail width; no Redux/Zustand/Context for collapse; no localStorage unless product asks.
Keep collapse animations lightweight (CSS width + label opacity).
Do not redesign unrelated shell/page UI when touching the sidebar.
Collapsed icon-rail: center brand glyph and nav icons in the 64px column; drive offsets only via `--rail` / `.shell` — no magic topbar left margins.
While the desktop rail is collapsing, keep the topbar menu as close (X) until the width animation finishes (do not flip to hamburger mid-transition).
Ticket list pagination (Phase 21+)
All tickets must use server page/limit from GET /api/tickets (do not fetch all rows and slice in React).
Limit options are exactly 10, 25, 50, 100; default 25 unless product asks otherwise.
Reset page to 1 when tab, Apply filters, Reset filters, or limit changes.
Reuse TablePagination; keep pagination in component state (do not put page/limit in the URL unless product asks).
Preserve tiles/tabCounts/over3Counts from the same list envelope.
Settings rules (Phase 13+)
Settings is self-service only: name, email, mobile, and password for the signed-in user.
Do not put admin Users/role management on Settings — that stays on Users.
Profile updates use PATCH /api/auth/me (not admin PATCH /api/users/:id). Current password is only required when changing password.
Password change must require current password and use POST /api/auth/change-password.
After self password change, keep the session by accepting the reissued JWT (do not force a cold login unless the API fails).
Role field on Settings is read-only.
Settings panels size to content (.settings-grid); save actions sit at the bottom of each form (.settings-actions).
Topbar logout uses an icon + confirmation modal before calling logout.
Ticket visibility & signup approval (Phase 15+)
Ticket access is enforced server-side; do not rely on React filtering.
"Every Ticket, Every Road" (Phase 51, supersedes the Phase 15/18/31/44/47/48 assignee rules): every user with All tickets `v` sees every ticket; Update ticket `e` may update any open ticket; `x` closes. There is **no** assignment: never add Assign / Reassign / Hand to UI, an "Assigned to" fact or column, an assignee filter, `assignTicket`, `assigneeId` on raise, `handoverToUserId`, or an assignee gate. `POST /api/tickets/:id/assign` no longer exists (404).
Historical assignee data stays read-only on the server; old `assigned` events may still appear in work history (`isAssignmentEvent` keeps rendering them) — do not hide or rewrite them.
Project Manager signup approval reuses PATCH /api/users/:id + Users e (PM seeded vce...); do not duplicate Admin logic.
User list visibility and delete (Phase 44+, hard delete in Phase 46) — the backend is the only enforcement point. `GET /api/users` already excludes the caller's own account and hides Admin accounts from non-Admin viewers, so the Users page must **not** re-filter rows by `user.id` or `user.role`; rendering the API payload as-is is the correct behaviour. `deleteUser(id)` → `DELETE /api/users/:id` is gated with `canPerm(user, 'Users', 'd')` (Admin only) and is a **hard delete**: the account is removed and its reporter / assignee / actor references on past tickets are cleared, so the tickets remain without the person's name. The button is therefore offered on every row, including `Inactive` ones, and the confirm copy must say the account is removed for good. Never offer a self-delete control: the own row is not in the list, and the backend rejects it with `SELF_DELETE_FORBIDDEN` anyway.
User create/edit role dropdowns must filter to same-or-below the actor using `ROLE_HIERARCHY` / `filterAssignableRoles` in `services/users.js` (mirrors backend Phase 36). Users `c`/`e` still gate the forms. Omit `roleId` on PATCH when unchanged. Backend remains authoritative for higher-role attempts (`403`).

Roles & permissions matrix is live: load/save via `/api/roles*`. Gate with Roles & permissions `v`/`c`/`e`/`d` (PM seed is view-only). Editing a selected role also requires `canManageRolePermissions` (same-or-below hierarchy; mirrors backend Phase 39). Admin has full access and no Permissions editor (`permissionsLocked`). Seeded roles can **Reset to defaults** (`POST …/permissions/reset`). Route access uses `RequirePerm` + page `canPerm`; UI checks remain advisory vs backend `authorize`. Sidebar visibility is matrix View only (`filterMenuByView` + `canPerm`) — no `hideForRoles` / Dashboard role-name overrides.

Role delete (`deleteRole` → `DELETE /api/roles/:id`, Roles & permissions `d`, Admin only) reuses the IssueMaster / Users-delete confirm pattern: a danger `Button` in the Roles table Action cell, a confirm `Modal` naming the role, a `deletingRole` busy flag. A role still held by an **Active or Pending** account is rejected by the backend with `409 ROLE_IN_USE`; `toastApiError` surfaces that message verbatim ("Role is assigned to users. Please change their role before deleting it.") and the role **stays in the list**. The Admin row never shows Delete (backend also rejects it with `403 ADMIN_ROLE_PROTECTED`). Never pre-filter the button by `row.users` or hardcode a client-side user lookup — the backend is the only source of truth for the guard, and the count can change between load and delete.

Role-less accounts (Phase 46+) — `GET /api/users` LEFT JOINs roles, so an account whose role was deleted arrives with `role: null` and `roleMissing: true`. Render that as "No role — select one" in the Role column; do not fall back to a dash or a stale name. `openEdit` seeds `editRoleId` from `row.roleId` (empty for these rows), and the Edit modal must refuse `status: 'Active'` while no role is chosen ("Select a role for this user before activating the account."), matching the backend `409 ROLE_REQUIRED`. Because `roleId` is omitted from the PATCH body when unchanged, an account that keeps its empty role can never be activated by accident.

`/dashboard` requires Dashboard `v` via `RequirePerm`. `/masters/parts` requires Update ticket `v` (aligned with `GET /api/parts`).
Frontend ticket rendering (Phase 16+)
TicketList / Dashboard / TicketDetail must consume scoped APIs; never download all tickets and filter in React for authorization.
Reuse canPerm and Users loading/empty/error patterns; do not add a second role store.
Preserve existing layout; only bind live data.
Raise create POST is live (Phase 27). Update Ticket shows the Add Update form on `/tickets/update` once the ticket is open (Phase 29; no assignee gate since Phase 51). Work report is live via `GET /api/reports/work` (+ CSV export) with Work report `v` (Phase 30). Leave Close page create POST until that API is wired (photo files may still upload on submit via uploadImages; Detail Add Update is live as of Phase 21).
Ticket list / detail UI (Phase 19+)
Tabs are **Open** (`open`, raised with no update yet), **Under Repair** (`urp`, at least one update — Waiting for spare included) and **Closed** (`cls`) since Phase 52; all show the Updates column. The backend Updates count includes only update-flow events (`visit_open`, `visit_resolved`, `waiting_spare`, `reclassified`) from any permitted actor; do not count raised, assigned, or closed events.
Closed tab (cls) shows Days After Close, not Days open.
`parseTab` maps old `asg` bookmarks to `urp` and any other unknown `?tab=` (including `new`) to `open`; never send `tab=asg` (backend 400). Tab rows come from the backend, not React filters.
Summary cards (Phase 52) are `.tile-link` buttons: a click sets the tab in the URL, the status and the age filter together, resets page 1 and refetches — keep `viewForTile` / `isTileSelected` as the single mapping. The status select only appears on Under Repair; Open and Closed always send `status=All`. `age=over3` is sent on Open / Under Repair only and is cleared when moving to Closed. Card numbers come from `tiles` and must not change when a card or tab is clicked.
Tab transitions (Phase 52): the sliding underline lives in the shared `Tabs` (`.tabs-ink`, positioned via DOM refs — do not move it into React state); TicketList keys the Panel by tab for the slide and clears rows in the same render as the tab change so no old rows flash. Keep the `prefers-reduced-motion` overrides.
Tiles come from the API; a historical assigned ticket still stored as Open/New is shown as Under repair by backend `listStatus` (DB unchanged) — do not remap it in the browser.
Add Update must reuse the existing form fields; present it in Modal only.
Add Update submit (Phase 21+): POST /api/tickets/:id/updates first (photos may be empty), then uploadImages, then PATCH …/updates/:eventId/photos. Do not upload photos before the update is accepted. Toast success only when all required steps succeed; reload work history from GET ticket.

Raise submit (Phase 38): POST /api/tickets first (photos may be empty), then uploadImages, then PATCH …/raised/:eventId/photos. Do not upload photos before the ticket is accepted. If create succeeds but photos fail, warn and still open the new ticket (do not re-create).
Show Add Update (and **Resolve**, same condition) when Update ticket `v` + `e` is set and status is not Closed — nothing else (Phase 51: no assignee, ops-role or field-role branch). Backend remains the authority for mutations.
Work history displays oldest → newest (new entries at the bottom); keep the trail always visible.
Show **View Update** on every work-history row; open a Modal with mapped trail fields only (when, actor, title, status, body, parts, cost, next visit). Do **not** put images, thumbnails, or ImagePreviewModal inside View Update.
View Update must render structured `issuesReported` / `issuesFound` when present: group each issue category, list every sub-category beneath it, show clear counts, and fall back to legacy scalar fields for older events. If no issue data exists, hide the issue section rather than showing an empty issue card.
Show **View Image** only when event photos is non-empty; gallery reuses Modal (main + thumbnails). Keep View Image separate from View Update.
ImagePreviewModal zoom/rotate/pan (Phase 24+ / 32): CSS `transform` only on the viewed image; do not modify or re-upload the original file; reset zoom/rotation/pan when the active thumbnail changes or via Reset. Desktop: hover zooms toward the pointer (Amazon-style explore). Mobile: pinch-to-zoom + drag pan. Keep `.img-preview-main` overflow hidden so the modal layout does not break.
Do not add image/modal libraries; do not invent duplicate optimistic trail rows; do not add a second GET for View Update when trail data is already loaded.
List → detail must pass state.from = /tickets?tab=…; Back to tickets / crumb must use that path so the active tab is preserved (do not hard-code /tickets when from is present).
Raise ticket Cancel / All tickets / crumb must use the same state.from tab return when opened from All tickets (JumpLinks already passes from; list Raise button must pass it too).
Home & Dashboard access (Phase 18+)
Only roles with Dashboard View may open Dashboard / land on `/dashboard` (`canPerm` / `homePathForUser`).
After login (and GuestOnly / / / catch-all), roles without Dashboard View go to /tickets.
Sidebar items are gated by permission matrix View only — do not hardcode role names in `Sidebar` / `filterMenuByView` (`hideForRoles` removed).
When Tickets has only All tickets visible, promote it to a top-level sidebar item (permission-driven, not role-name).

Raise and Update ticket forms may collect multiple Category → Sub pairs as `issues[]` (backend Phase 41). Update starts with a blank issue row; do not prefill it from reported/found ticket data. Do not invent alternate field names. Site attendant Device Sync and Issue Master actions use `canPerm` only — no `if (role === 'Site attendant')` for those features.
Unauthorized Users redirect uses homePathForUser, not a hard-coded /dashboard.
Ticket status & list columns (Phase 18+)
Do not show ticket status New; use Open (normalize legacy API/DB values).
Ticket list tab ids are `open` / `urp` / `cls` (Phase 51 renamed `new` → `open` and removed `asg`; Phase 52 added `urp`).
TicketList has no Assigned to column (Phase 51); Raised by stays before Updates.
QR scan / Raise rules (Phase 17+ / 27+)
Camera Scan is available to any signed-in user (`canScanWithCamera` = Boolean(user)).
Resolve scans with live `resolveScan`: sticker `qr_token` → `POST /api/devices/slot-mac`; legacy PD/QR/slot → `GET /api/devices/scan?q=`. Do not call SmartPark from the browser. Do not invent /devices/by-qr or /tickets/by-slot.
Open ticket = status ≠ Closed. Since Phase 50 a device may hold several open tickets — duplicates are per **issue**: the same Open issue on the same device must go on its existing ticket; a different issue (or one only on a Closed ticket) is raised as a new ticket. Read open tickets with `scanOpenTickets(scan)` (`data/scanDevice.js`, from scan `openTickets[]`); never block Raise just because `openTicketId` is set. Backend remains authoritative (409 OPEN_TICKET_EXISTS with `details.issues`).
Do not proceed to raise when device lookup fails or returns miss. Do not assume no open ticket when the scan API errors.
Raise create: POST /api/tickets with scan deviceId (not QR alone) + issues[] (or category/subCategory UUIDs) from GET /api/issues; photos via create → upload → PATCH …/raised/:eventId/photos (Phase 38). On OPEN_TICKET_EXISTS, use `details.issues` (same branching as the pre-check below) and refresh the scan. `REOPEN_SAME_TICKET` no longer exists (Phase 50) — do not handle it.
Raise with open tickets (Phase 50): list every open ticket with its Open issues in the `.reclass` block, each with primary **Update Ticket** → `/tickets/update?ticketId=` (+ `qr` / `from` state) and secondary Open → `/tickets/:id`; the problem form and Raise stay available. Before submit, `findOpenIssueDuplicates(scan, issues)`: all selected issues on one ticket → toast + Update Ticket; otherwise toast naming the duplicates and stop. This is UX only — never skip the backend 409 handling.
QR Update with several open tickets: auto-open only when there is exactly one; otherwise show the pick list (open issues + **Update this ticket** → existing `activateTicket`) and a "Raise a ticket for a different issue" link to `/tickets/raise` with `qr` state. Same gate and form as every other entry — no QR-specific update logic.
`/tickets/update` is the Update Ticket experience: QR find-device (or entry `ticketId`), `loadUpdatableTicket` via `getTicket` (only a Closed ticket is refused, with a toast), then render shared `TicketAddUpdateForm` on the page. Do **not** redirect Update Ticket actions to `/tickets/:id`. No assignee gate (Phase 51).

Phase 47 ticket flow rules:
- Raise is gated by `canPerm(user, 'Raise ticket', 'c')` only — never by role name. Technician / Engineer / Electrician get it from the backend matrix.
- *(Phase 51 removed the Phase 47 Raise **Assign to**, auto-assign on update, Admin/PM holder pick and `TICKET_ALREADY_ASSIGNED` handling. Do not restore them.)*
- **Close Ticket** Yes / No lives in `TicketAddUpdateForm`, defaults to **No** (also from Resolve), and only Yes sends `closeTicket: true`. Update + close is one POST; never chain a second close call. Show it only with Update ticket `x`.
- **Resolve** reuses the Add Update modal with update type `Site visit — resolved`. It does not close by itself.

Phase 49 per-issue rules:
- Only reported issues carry Open/Resolved. Resolvable issues = `openReportedIssues(ticket.issuesReported)` from the latest `getTicket`; pass them to `TicketAddUpdateForm` as `openIssues` from every entry point (Detail Add update / Resolve, `/tickets/update`, QR). Never list a Resolved issue as resolvable and never keep a client-side "resolved" set across tickets.
- Send the selection as `resolveIssueIds` in the same Add Update POST — never a separate issue-status call. The backend re-checks every id; `409 ISSUE_ALREADY_RESOLVED` → toast + `onConflict` reload, `400 INVALID_ISSUES` → toast only.
- Resolving the last issue does not close the ticket; Close Ticket stays **No** by default. Closing resolves the remaining issues on the server — do not resolve them in the browser first.
- The found-on-site issue rows are separate (classification, replace semantics); do not merge them with the Resolve issues chips. *(Phase 51: the form no longer renders found-on-site rows; it uses "Add another issue" → `addIssues` instead.)*

Phase 51 Main/Sub issue rules:
- `TicketResolveIssues` groups `reportedIssues` (all reported issues from the latest `getTicket`) by Main Issue (category) with `groupIssuesForResolve`; each group is a collapsible panel. Since Phase 52 every raised group is listed at once and **expanded by default** (the Phase 51 collapsed panels and the one-at-a-time **Another Issue** button were removed at the user's request).
- Main Issue checkbox → `resolveCategoryIds` (server resolves every Open sub of it); Sub Issue checkbox → `resolveIssueIds`. Checking a main covers its subs in the UI; do not also send their ids. Resolved sub issues and fully resolved main issues are **hidden** in Resolve Issues (Phase 52 follow-up — the form shows only work left; the ticket's Issues card and work history still show them). When nothing is left Open, show "Every raised issue is already resolved…" and keep Add another issue. Never compute "all subs" client-side for the request.
- The block is labelled **Reported Issues** (Phase 52; component name `TicketResolveIssues` unchanged). **Visited by** is a required, selectable field for every user (no `pickVisitedBy` / dashboard-role branch); field staff default to themselves.
- **Add another issue** is always shown below the raised issues (Phase 52); clicking it opens the "New issues" block, which reuses `TicketIssueRows` (Issue category → Sub-category) and sends `addIssues: [{ categoryId, subCategoryId }]`. New issues are appended after the raised ones and are Open. Raised issues always render first.
- `409 ISSUE_ALREADY_RESOLVED` / `ISSUE_ALREADY_ON_TICKET` / `OPEN_TICKET_EXISTS` → toast + `onConflict` reload; `400 INVALID_ISSUES` → toast. Resolving every issue never closes — Close Ticket stays an explicit Yes.
- Same panel and payload on every entry point: Detail Add update / Resolve, `/tickets/update`, QR (Admin, Control room with `e`, PM, field roles alike).
Reuse existing QrScannerModal and resolveScan. Backend remains final authorization on POST update.
Reuse `TicketAddUpdateForm` for Detail Modal and Update page — do not duplicate submit/API logic.
Avoid duplicate in-flight scan lookups; clear stale device state before a new scan.
Do not keep mock loadTicket / fixed-not-fixed panels on Update Ticket.
External inspection package path (PROJECT_PATH) is deferred until product supplies it.
Photo attachments (Phase 20 — Image attachment in ticket)
Reuse one PhotoPicker for folder and camera. Validate client-side (image/*, 8 MB); keep local File + object-URL preview until form submit, then uploadImages (POST /api/uploads). Do not upload on every add.
Camera capture uses CameraCaptureModal — not QrScannerModal; no extra camera library.
Flip front/rear with the overlay icon on the live preview (`.camera-flip-btn`), not a text button in the bottom action row. Camera step actions stay Cancel + Take photo in one row.
After Take photo: crop/review → Upload (confirm File into picker) or Recapture. Crop preview must fit the viewport (`.camera-crop-image` max-height with `dvh`/`object-fit: contain`); keep stage transparent — no black letterbox. Review actions stay sticky and reachable on mobile; enlarge crop handles on narrow screens.
Default max is 5 photos; toast when over limit; hide Add when at limit.
Keep the compact photo tile (do not full-bleed Add photo).
Field / PhotoPicker / modal (Phase 21+)
Field must render div.fld, never label.fld. A wrapping label activates the first nested button/input and makes the first photo × remove (or look like it removes) other thumbs.
PhotoPicker: on remove, revoke only that item’s object URL (do not rebuild/revoke remaining URLs).
Keep a persistent hidden file input for folder picks (do not mount the native file control inside a portaled menu that unmounts mid-pick). Never show the browser “Choose files” chrome in the Photos row — Add photo tile is leftmost when empty.
Inside Modals, portal the photo source menu and CameraCaptureModal to document.body; use Modal elevated so camera stacks above Add Update. Escape closes only the topmost dialog.
Ticket Update (Phase 21+): no Hand over / Next visit planned fields; Photos before Work done / Work done today.
Landing chrome rules
Prefer page-body toolbars (.page-toolbar, JumpLinks actions, panel-head actions, collapsible filters) over sticky topbar action slots for filters and primary CTAs.
Dashboard no longer shows the open-tickets table; use All tickets for that list.
Fleet legend secondary status notes belong in Tooltip, not inline <em> copy.
Panel .foot-note should sit at the bottom of equal-height grid cards (margin-top: auto).
Field ticket flow rules (Phase 14+)
Raise ticket has two steps (device + problem). Do not restore the “Who should attend” assign/priority panel unless product asks.
Raise ticket does not render a Reported by field; the backend continues to derive the reporter from the signed-in session. There is no assignment anywhere (Phase 51).
Keep PhotoPicker as the original compact dashed tile — do not stretch Add photo full-width without product ask.
Field action rows (.sticky-bar) must stay in document flow (position: static). Do not reintroduce viewport-fixed footers without product ask.
Constrain action buttons with .sticky-bar-inner to the mobile form width (580px). Keep the bar background transparent (no full-bleed white strip).
Loading skeletons (Phase 22+)
Live-data screens (TicketList, TicketDetail, Dashboard, Users, Auth boot) must show layout-matching skeletons while fetching — not a lone “Loading…” line.
Reuse Skeleton / SkeletonTiles / SkeletonTable; keep empty and error paths unchanged.
Shimmer CSS must respect prefers-reduced-motion (animation: none).
Do not add skeleton libraries.
Parts & visit cost (Phase 23+)
Live Parts changed must load from GET /api/parts (or lookups/parts) — do not hardcode part lists for live submits. On Update, show one **Parts were changed** radio with a single **Yes** option; show the searchable PartChips dropdown, selected removable tags, Labour / other charges, then a cost summary with Parts Total, optional Labour / other charges, and Total Amount. Labour must be zero or positive; do not add a new request field.
Submit parts as UUID arrays; cost on update/close is labour / other charges only — server adds master part amounts.
Do not treat client-displayed part amounts or a client sum as authoritative Cost of Visit.
Do not invent edit-update-parts APIs; trail shows snapshots from workHistory after create.
Masters submenu labels are Issue / Road / Parts (keep group title Masters). Permission screen keys remain Issue master / Road master until backend renames.
Technicians may create and update parts (`POST` / `PATCH /api/parts`); soft-deactivate via `PATCH { active: false }` (Edit modal toggle or after `IN_USE`). Hard-delete unused parts via `DELETE /api/parts/:id` (Issue master `d`); used → `409 IN_USE` then deactivate. Issue Master is live for list/create/edit/delete: create category/sub needs Issue master `c`; subcategory and category hard-delete need `d` (`409 IN_USE` → deactivate — category deactivate needs `e`). Do not grant Technicians Issue master create/edit solely for parts — backend allows Technician role on parts create/update only.
Parts nav icon must be interlocking gears — not a bolt and not the Settings single gear.
What to avoid
No redesign, modernization, or “AI default” aesthetic.
No purple gradients, cream+serif trends, or unrelated design systems.
No unnecessary libraries or state managers.
No modifying the original source project.
No inventing APIs or features not in original or explicitly requested.
Login / session were approved in Phase 10. Phase 11 adds self-signup (Pending → admin approve), forgot/reset password UI, and admin change-password via existing APIs. Phase 13 adds self-service Settings profile/password. Do not add OTP or third-party auth without asking.
No reintroducing stripped features (inventory, SLA maps, SIM/battery fields, issue codes, etc.).
No turning flow screens into top-level menu items.
No merging multiple screens into one page.
No excessive componentization (one wrapper per DOM node).
No deep abstraction layers, magic helpers, or AI-only architecture.
No silent swallowing of errors; match original toast/empty behavior.
No changing business copy or sample data meaning without reason.
Do not re-cap .page at 1360px without product ask — shell should fill available width beside the rail.
Manual maintainability rule

Code must remain maintainable without AI. Prefer:

Readable code · Simple components · Clear naming · Explicit logic · Predictable structure


Avoid:

Deep abstractions · Over-engineering · Magic helpers · Unnecessary patterns · AI-dependent workflows

Error handling
Preview forms: prevent default submit; toast preview message (same as app.js).
Connected forms (auth, Users, Settings): toast API error message via ApiRequestError.
Scan miss: show empty panel (same as scan-qr.html).
Do not invent global error boundaries that change UX unless needed for React crash safety (silent fallback UI ok for runtime crashes only).
When APIs arrive later: surface failures in-page; do not invent a different error language than product copy.
AI boundaries
Do not invent requirements or screens.
Do not invent functionality absent from original + approved scope.
Do not change business logic without evidence from source or user.
Do not replace APIs (none exist yet) with unrelated backends.
Do not redesign UI.
Prefer inspecting source over assuming.
Mark uncertainty explicitly (Needs verification).
Do not introduce abstractions that require tribal AI knowledge to edit.
Write code a typical React developer can maintain from the docs alone.
Authorization
Preserve role matrix and role help text from users.html.
Control room raises and watches tickets but does not close them; closing needs Update ticket `x` (no holder since Phase 51) — keep this in UI copy and future permission checks.
Deactivate users; never delete (preserve wording and buttons).
Do not expose secrets; preview has none. Future tokens stay out of logs and client bundles beyond what the API requires.
UI permission checks are advisory; backend is authoritative for Users edit (including password) and approval.
Deactivate users; never hard-delete (preserve wording and buttons). The Users **Delete** action is a deactivation, so "never delete" still holds — the account is only set to `Inactive` and remains readable on past tickets.
Self Settings updates are scoped to the authenticated user only (backend /api/auth/me and /change-password).
Backend rules (Phase 11+)
Analyze existing APIs before modifying them.
Reuse existing services and utilities (lib/auth.ts hashing, reset tokens, PATCH /api/users).
Preserve existing API contracts where possible.
Do not rewrite working authentication logic.
Do not duplicate password or authorization logic.
Prefer extending /api/auth/* for self-service account changes; keep admin user edits on /api/users.
Do not create unnecessary database structures.
Keep changes small, targeted, readable, and manually maintainable.
Optimization rules
Write the minimum code required; avoid unnecessary abstractions and dependencies.
Avoid duplicate validation, queries, and authorization checks.
Reuse existing error handling (ApiError / handleApiError).
Do not perform unrelated refactoring.
Security rules
Never store plaintext passwords; reuse bcrypt via hashPassword / verifyPassword.
Protect approval and admin password-change with existing authorize('Users', …).
Self password change must verify the current password before updating.
Validate reset tokens; respect expiration; do not return tokens in API responses.
Do not expose whether an email exists on forgot-password for unknown / Pending / Inactive accounts (generic success message).
Forgot / email reset is **Admin** and **Project manager** only. Backend must return `403` / `FORGOT_PASSWORD_ROLE_DENIED` for other Active roles (explicit message). Do not issue a reset token for denied roles. Reset-password must enforce the same role check and must not mark the token used when denying.
Do not add `styled-components` for the 404 gear animation — use `GearLoader` + `index.css` theme tokens; no black gearbox background.
Unknown routes must render `NotFound` (not silent `HomeRedirect` to home).
Do not allow unauthorized role changes or self-approval.
Password version / denylist must remain authoritative after password changes.
Device Sync (Phase 26+)
Frontend must call our backend `POST /api/device-sync` / status GETs — never the external SmartPark Device Sync URL from the browser.
Sync UI must stay non-blocking (disable Sync button only; no full-page blocker). Do not process the external sync dataset on the browser main thread.
Prevent accidental duplicate sync requests while submitting or while status is `started`; respect backend `409 SYNC_IN_PROGRESS`.
Gate Sync on Device list `c`; preserve backend authorization.
Reuse existing `api` / `toast` / `Button` / `TablePagination` / device-sync helpers — no new libraries or React Query.
Backend is the source of truth for sync validation (incomplete slot/MAC skips) and Slot-ID + MAC upserts. Do not invent incomplete devices or duplicate rows in frontend state.
On sync complete, toast only returned device stats keys (`devicesCreated` / `devicesUpdated` / `devicesSkipped`) when numeric; do not invent skip-reason lists or other fields.
Preserve device list pagination, search, filters, and current page on post-sync refresh.
Existing devices must retain ticket Raise / Update / Detail flows after sync.
Device list table columns for this phase: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location only.
Device list rows arrive sorted by Slot Label ascending from `GET /api/devices` (Phase 44). Do not sort rows in React — server-side `LIMIT/OFFSET` pagination means a client sort would only order one page. Filters, search, tiles, and the pagination envelope are unchanged.
Device list status tiles (Working / Under repair / Not working / Total) must apply the existing `status` filter via `listDevices` and stay on `/devices`. Do not link Under repair / Not working to `/tickets`.
Do not invent client-only sync locking as a replacement for backend single-flight.
Do not modify unrelated Device Detail / Scan / Add flows when wiring sync.
## Slot View rules (Phase 53+)

- Slot View is one top-level sidebar item directly after Dashboard, gated by its own matrix screen `Slot View` `v` in `MENU`, `RequirePerm` and the pages; the backend `authorize('Slot View', 'v')` stays authoritative. Defaults: Admin and Project manager; Admins grant or revoke it per role in Roles & permissions (`PERM_SCREENS` group `Slot View`). Never add a role-name check for it.
- The slot detail's Tickets panel and ticket links need `All tickets` `v` (they use `GET /api/tickets` and `/tickets/:ticketId`). Without it, show the "Ticket list not available" empty state and plain ticket ids; never call the list and surface a 403.
- Slot list = `GET /api/slot-view` only (ticketed slots, server pagination via `TablePagination`, server natural Slot Label order). Never load every device or ticket to build it, never sort or count in React.
- Slot ID and Slot Label both open the same `/slot-view/:slotId` page; there is no second detail page.
- Unresolved issues come from `GET /api/slot-view/:slotId` already filtered to Open; never show Resolved issues there and never re-derive status in the browser. Ticket list = every ticket of the slot (`listTickets({ device })`, no tab); do not hide Closed tickets.
- Reuse `TicketTable`, `EmptyState`, `Panel`, `Skeleton*`, the inline error strip and the existing `/tickets/:ticketId` route; no new table, pagination, empty-state or error pattern.
## Notification rules (Phase 39+)

- Consume the backend `/api/notifications` contract; do not add a second notification store or recreate ticket recipient rules in the browser.
- The backend is authoritative for `ticket.raised` recipients, `All tickets v`, ticket visibility, notification ownership, and read state.
- Show the notification UI only for the backend-supported recipient roles (`Admin`, `Project manager`, `Control room`) with `All tickets v`; this is a UX guard, not authorization.
- Use one shared notification hook/state for the bell, Tickets parent badge, and All tickets child badge. Never sum the two badges or calculate unread state from the loaded page alone.
- Request `Notification.requestPermission()` only from an explicit user click (Settings → Notifications), and only while `Notification.permission === 'default'`. Never prompt on load, on login or on refresh. Provide non-repeating guidance for denied permission; the app cannot reset a `denied` permission.
- **Browser permission and the application preference are separate layers (Phase 54).** `user.notificationPreferences.pushNotificationsEnabled` (database, per user) is the only ON/OFF switch. Never derive it from `Notification.permission`, and never show "Push Off" and "Permission denied" as the same state.
- The backend enforces Push OFF for every device. Never rely on frontend filtering to stop pushes, and never unsubscribe the browser when the user turns push off.
- Play Notification Sound is only available while push is On; disable it (keeping its value) when push is Off. Gate the in-app MP3 on push On **and** sound On.
- Logout removes only this browser's server subscription record (`DELETE /push-subscriptions/:id`). Keep the browser subscription and permission so the next login re-registers silently.
- Save preferences only through `AuthContext.updateNotificationPreferences` → `PATCH /api/auth/me/notification-preferences` (own user only). Do not send a user id and do not add a second preferences store.
- Push controls live in Settings only. The bell may show a "Turn on browser alerts in Settings" link (push On, permission `default`), but no permission or subscription buttons.
- Register/reconcile push through the existing `GET /api/notifications/push-config` and `PUT/DELETE /api/notifications/push-subscriptions` endpoints.
- Keep the service worker push-only: it may show/handle notifications, but protected API calls and JWT access remain in the authenticated page.
- Play `public/sounds/elevenlabs-achievement-unlock.mp3` (only when the user's push and sound preferences are both On) only for a newly received push or an increase in the backend unread count, including when an application tab is open in the background; debounce duplicate push/poll events and do not treat autoplay rejection as a notification failure.
- Use the existing `/tickets/:ticketId` route for notification navigation. Treat `canOpen`/`url` as hints and let the existing 403/404 handling enforce access.
- Preserve the current sidebar collapse, drawer, group expansion, responsive breakpoints, and role filtering.
- Do not add WebSocket, Socket.IO, SSE, a second service worker, a notification library, or a new Notifications menu item.
- **Bell vs full list (Phase 55).** The bell popover loads only the latest 10 (`page: 1, limit: 10`) and links to `/notifications`. The full list lives only on that page, with server pagination (`TablePagination`) and `unreadOnly` for the Unread tab; never load every notification into the popover or the hook.
- Render notification rows only with `components/notifications/NotificationItem`; do not copy the row markup.
- The Notifications page uses the shared hook through `useOutletContext()` for `openNotification`, `markAllRead` and `unreadCount`; it must not mark read or count unread on its own.

## READ-ONLY SOURCE TREE

The following original source tree is READ-ONLY:

C:\Users\MTPC-359\Desktop\Project\parking_device_maintenance\parking_maintenance

No writes, deletes, installs, or formatters against that tree.