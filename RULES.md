# RULES.md — Project Rules

## What to do

- Preserve original UI, spacing, typography, colors, and interactions.
- Preserve all existing screens and flows unless the user explicitly drops them.
- Treat original HTML/CSS/JS as visual/behavioral source of truth.
- Treat product skill / Claude scope as product-rule source of truth when they constrain fields, menu, and statuses.
- Reuse assets and inline SVG paths from the original.
- Prefer reusable React components only when the same pattern appears on multiple pages.
- Use Tailwind utilities for most styling; map CSS variables into the Tailwind theme.
- Keep custom CSS for cases Tailwind cannot match cleanly (pseudo elements, split-table group headers, scan frame line, tooltips, etc.).
- Prefer conventional React: props, local state, simple hooks, React Router.
- Keep logic next to the page that uses it.
- Name files after screens (`TicketList.jsx`, not `TicketsContainerView`).
- Validate each migrated page against the original HTML side-by-side (except deliberate, documented deviations).
- Update MEMORY.md when finishing a phase or making a decision.
- Keep documentation (PR, ARCHITECTURE, RULES, DESIGN, PHASES, SKILLS) accurate.
- Leave `parking_maintenance` (original path) **read-only**.

## Sidebar rules (Phase 12+)

- Preserve existing MENU routes, active `pageId` matching, and group expand/collapse.
- Keep Settings as a **bottom utility** (not inside `MENU`); route is `/settings`.
- Desktop collapse (`railCollapsed`) must stay separate from mobile drawer (`railOpen`).
- Reuse `NavIcons` — do not add an icon library.
- Prefer local `useState` in AppLayout for rail width; no Redux/Zustand/Context for collapse; no localStorage unless product asks.
- Keep collapse animations lightweight (CSS width + label opacity).
- Do not redesign unrelated shell/page UI when touching the sidebar.

## Settings rules (Phase 13+)

- Settings is **self-service only**: name, email, mobile, and password for the signed-in user.
- Do not put admin Users/role management on Settings — that stays on Users.
- Profile updates use `PATCH /api/auth/me` (not admin `PATCH /api/users/:id`). Current password is only required when changing password.
- Password change must require **current password** and use `POST /api/auth/change-password`.
- After self password change, keep the session by accepting the reissued JWT (do not force a cold login unless the API fails).
- Role field on Settings is read-only.
- Settings panels size to content (`.settings-grid`); save actions sit at the bottom of each form (`.settings-actions`).
- Topbar logout uses an icon + confirmation modal before calling logout.

## Landing chrome rules

- Prefer page-body toolbars (`.page-toolbar`, JumpLinks `actions`, panel-head actions, collapsible filters) over sticky topbar action slots for filters and primary CTAs.
- Dashboard no longer shows the open-tickets table; use All tickets for that list.
- Fleet legend secondary status notes belong in `Tooltip`, not inline `<em>` copy.
- Panel `.foot-note` should sit at the bottom of equal-height grid cards (`margin-top: auto`).

## What to avoid

- No redesign, modernization, or “AI default” aesthetic.
- No purple gradients, cream+serif trends, or unrelated design systems.
- No unnecessary libraries or state managers.
- No modifying the original source project.
- No inventing APIs or features not in original or explicitly requested.
- Login / session were approved in Phase 10. Phase 11 adds self-signup (Pending → admin approve), forgot/reset password UI, and admin change-password via existing APIs. Phase 13 adds self-service Settings profile/password. Do not add OTP or third-party auth without asking.
- No reintroducing stripped features (inventory, SLA maps, SIM/battery fields, issue codes, etc.).
- No turning flow screens into top-level menu items.
- No merging multiple screens into one page.
- No excessive componentization (one wrapper per DOM node).
- No deep abstraction layers, magic helpers, or AI-only architecture.
- No silent swallowing of errors; match original toast/empty behavior.
- No changing business copy or sample data meaning without reason.
- Do not re-cap `.page` at `1360px` without product ask — shell should fill available width beside the rail.

## Manual maintainability rule

Code must remain maintainable **without AI**. Prefer:

```text
Readable code · Simple components · Clear naming · Explicit logic · Predictable structure
```

Avoid:

```text
Deep abstractions · Over-engineering · Magic helpers · Unnecessary patterns · AI-dependent workflows
```

## Error handling

- Preview forms: prevent default submit; toast preview message (same as `app.js`).
- Connected forms (auth, Users, Settings): toast API error message via `ApiRequestError`.
- Scan miss: show empty panel (same as `scan-qr.html`).
- Do not invent global error boundaries that change UX unless needed for React crash safety (silent fallback UI ok for runtime crashes only).
- When APIs arrive later: surface failures in-page; do not invent a different error language than product copy.

## AI boundaries

- Do not invent requirements or screens.
- Do not invent functionality absent from original + approved scope.
- Do not change business logic without evidence from source or user.
- Do not replace APIs (none exist yet) with unrelated backends.
- Do not redesign UI.
- Prefer inspecting source over assuming.
- Mark uncertainty explicitly (`Needs verification`).
- Do not introduce abstractions that require tribal AI knowledge to edit.
- Write code a typical React developer can maintain from the docs alone.

## Authorization

- Preserve role matrix and role help text from `users.html`.
- Control room can assign but not close; closing belongs to the holder — keep this in UI copy and future permission checks.
- Deactivate users; never delete (preserve wording and buttons).
- Do not expose secrets; preview has none. Future tokens stay out of logs and client bundles beyond what the API requires.
- UI permission checks are advisory; backend is authoritative for Users edit (including password) and approval.
- Self Settings updates are scoped to the authenticated user only (backend `/api/auth/me` and `/change-password`).

## Backend rules (Phase 11+)

- Analyze existing APIs before modifying them.
- Reuse existing services and utilities (`lib/auth.ts` hashing, reset tokens, `PATCH /api/users`).
- Preserve existing API contracts where possible.
- Do not rewrite working authentication logic.
- Do not duplicate password or authorization logic.
- Prefer extending `/api/auth/*` for self-service account changes; keep admin user edits on `/api/users`.
- Do not create unnecessary database structures.
- Keep changes small, targeted, readable, and manually maintainable.

## Optimization rules

- Write the minimum code required; avoid unnecessary abstractions and dependencies.
- Avoid duplicate validation, queries, and authorization checks.
- Reuse existing error handling (`ApiError` / `handleApiError`).
- Do not perform unrelated refactoring.

## Security rules

- Never store plaintext passwords; reuse bcrypt via `hashPassword` / `verifyPassword`.
- Protect approval and admin password-change with existing `authorize('Users', …)`.
- Self password change must verify the current password before updating.
- Validate reset tokens; respect expiration; do not return tokens in API responses.
- Do not expose whether an email exists on forgot-password (generic message).
- Do not allow unauthorized role changes or self-approval.
- Password version / denylist must remain authoritative after password changes.

**READ-ONLY** on:

`C:\Users\MTPC-359\Desktop\Project\parking_device_maintenance\parking_maintenance`

No writes, deletes, installs, or formatters against that tree.
