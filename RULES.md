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
Preserve tiles/tabCounts from the same list envelope.
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
Ticket access must be enforced server-side (lib/ticket-access.ts); do not rely on React filtering.
Non–Admin/PM users only see tickets they raised or are assigned to (assignee_id / raised_by_user_id).
Admin and Project manager keep existing city-wide ticket visibility.
Do not AND ticket list/export with assigned_roads in a way that hides tickets the user raised on other roads (Phase 18). Device lists may still use road scope.
Detail access: raiser and assignee always allowed, even outside user_roads; then road check; otherwise forbid.
Assign (All tickets a) uses road access only — do not apply ownership filter on assign (Control room must assign others’ tickets).
Project Manager signup approval reuses PATCH /api/users/:id + Users e (PM seeded vce...); do not duplicate Admin logic.
Do not invent a separate role hierarchy unless product asks; avoid unnecessary queries and abstractions.
Frontend ticket rendering (Phase 16+)
TicketList / Dashboard / TicketDetail must consume scoped APIs; never download all tickets and filter in React for authorization.
Reuse canPerm and Users loading/empty/error patterns; do not add a second role store.
Preserve existing layout; only bind live data.
Leave Raise/Update/Close create POST and WorkReport mock until those APIs are wired (photo files may still upload on submit via uploadImages; Detail Add Update is live as of Phase 21; Work report backend is not ownership-scoped yet).
Ticket list / detail UI (Phase 19+)
Open tab (new) must not show the Updates column; Assigned keeps it.
Closed tab (cls) shows Days After Close, not Days open.
Open tab (new) = unassigned non-closed only; Assigned (asg) = has assignee; Closed unchanged — enforce in backend tabForStatus (not React row filters).
Tile Open, not attended must match Open tab; assigned rows still stored as Open/New must listStatus as Under repair for pills and Under repair tile (DB unchanged).
Add Update must reuse the existing form fields; present it in Modal only.
Add Update submit (Phase 21+): POST /api/tickets/:id/updates first (photos may be empty), then uploadImages, then PATCH …/updates/:eventId/photos. Do not upload photos before the update is accepted. Toast success only when all required steps succeed; reload work history from GET ticket.
Show Add Update only when canPerm(user, 'Update ticket', 'e'). Backend remains the authority (Admin/PM, holder, unassigned claim, or raiser).
Work history displays oldest → newest (new entries at the bottom); keep the trail always visible.
Show **View Update** on every work-history row; open a Modal with mapped trail fields only (when, actor, title, status, body, cost, next visit, parts). Do **not** put images, thumbnails, or ImagePreviewModal inside View Update.
Show **View Image** only when event photos is non-empty; gallery reuses Modal (main + thumbnails). Keep View Image separate from View Update.
ImagePreviewModal zoom/rotate/pan (Phase 24+): CSS `transform` only on the viewed image; do not modify or re-upload the original file; reset zoom/rotation/pan when the active thumbnail changes; when zoom > 1, allow pointer-move and drag pan inside `.img-preview-main` (overflow hidden) so the user can explore clipped regions; keep the modal layout from breaking.
Do not add image/modal libraries; do not invent duplicate optimistic trail rows; do not add a second GET for View Update when trail data is already loaded.
List → detail must pass state.from = /tickets?tab=…; Back to tickets / crumb must use that path so the active tab is preserved (do not hard-code /tickets when from is present).
Raise ticket Cancel / All tickets / crumb must use the same state.from tab return when opened from All tickets (JumpLinks already passes from; list Raise button must pass it too).
Home & Dashboard access (Phase 18+)
Only Admin and Project manager may open Dashboard (isDashboardRole / homePathForUser).
After login (and GuestOnly / / / catch-all), non–ops-lead roles go to /tickets.
Hide Dashboard in the sidebar for other roles even if permissions still list Dashboard v.
Unauthorized Users redirect uses homePathForUser, not a hard-coded /dashboard.
Ticket status & list columns (Phase 18+)
Do not show ticket status New; use Open (normalize legacy API/DB values).
Ticket list Open tab label is Open (keep tab id new for API compatibility unless product renames the query param).
Keep Raised by immediately before Assigned to on TicketList.
QR scan rules (Phase 17+)
Camera Scan is for Site attendant and Technician only (user.role check).
Until QR format is finalized, any successful decode uses resolveScan mock (not live security).
Open ticket = status ≠ Closed; at most one open ticket per device (backend OPEN_TICKET_EXISTS + FE block on Raise).
Do not rewrite Technician Update inspection panels — only open the camera before existing mock load.
External inspection package path (PROJECT_PATH) is deferred until product supplies it.
Photo attachments (Phase 20 — Image attachment in ticket)
Reuse one PhotoPicker for folder and camera. Validate client-side (image/*, 8 MB); keep local File + object-URL preview until form submit, then uploadImages (POST /api/uploads). Do not upload on every add.
Camera capture uses CameraCaptureModal — not QrScannerModal; no extra camera library.
Flip front/rear with the overlay icon on the live preview (`.camera-flip-btn`), not a text button in the bottom action row. Camera step actions stay Cancel + Take photo in one row.
After Take photo: crop/review → Upload (confirm File into picker) or Recapture. Crop preview must be full modal width (`.camera-crop-image` width 100%); do not reintroduce a dark letterbox stage behind portrait shots.
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
Reported by is the signed-in user (read-only). Assignment stays with Admin / control room elsewhere.
Keep PhotoPicker as the original compact dashed tile — do not stretch Add photo full-width without product ask.
Field action rows (.sticky-bar) must stay in document flow (position: static). Do not reintroduce viewport-fixed footers without product ask.
Constrain action buttons with .sticky-bar-inner to the mobile form width (580px). Keep the bar background transparent (no full-bleed white strip).
Loading skeletons (Phase 22+)
Live-data screens (TicketList, TicketDetail, Dashboard, Users, Auth boot) must show layout-matching skeletons while fetching — not a lone “Loading…” line.
Reuse Skeleton / SkeletonTiles / SkeletonTable; keep empty and error paths unchanged.
Shimmer CSS must respect prefers-reduced-motion (animation: none).
Do not add skeleton libraries.
Parts & visit cost (Phase 23+)
Live Parts changed must load from GET /api/parts (or lookups/parts) — do not hardcode part lists for live submits.
Submit parts as UUID arrays; cost on update/close is labour / other charges only — server adds master part amounts.
Do not treat client-displayed part amounts or a client sum as authoritative Cost of Visit.
Do not invent edit-update-parts APIs; trail shows snapshots from workHistory after create.
Masters submenu labels are Issue / Road / Parts (keep group title Masters). Permission screen keys remain Issue master / Road master until backend renames.
Technicians may create and update parts (`POST` / `PATCH /api/parts`); deactivate in the UI still needs Issue master edit. Do not grant Technicians Issue master create/edit solely for this — backend allows Technician role on parts create/update only.
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
Control room can assign but not close; closing belongs to the holder — keep this in UI copy and future permission checks.
Deactivate users; never delete (preserve wording and buttons).
Do not expose secrets; preview has none. Future tokens stay out of logs and client bundles beyond what the API requires.
UI permission checks are advisory; backend is authoritative for Users edit (including password) and approval.
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
Sync UI must stay non-blocking (disable Sync button only; no full-page blocker).
Prevent accidental duplicate sync requests while submitting or while status is `started`; respect backend `409 SYNC_IN_PROGRESS`.
Gate Sync on Device list `c`; preserve backend authorization.
Reuse existing `api` / `toast` / `Button` / `TablePagination` — no new libraries or React Query.
Preserve device list pagination, search, filters, and current page on post-sync refresh.
Device list table columns for this phase: Slot Id, Slot Label, Slot Identifier, QR Number, Parking Location only.
Do not invent client-only sync locking as a replacement for backend single-flight.
Do not modify unrelated Device Detail / Scan / Add flows when wiring sync.
READ-ONLY SOURCE TREE

The following original source tree is READ-ONLY:

C:\Users\MTPC-359\Desktop\Project\parking_device_maintenance\parking_maintenance

No writes, deletes, installs, or formatters against that tree.