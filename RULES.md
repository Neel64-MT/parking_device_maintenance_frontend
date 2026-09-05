# RULES.md — Project Rules

## What to do

- Preserve original UI, spacing, typography, colors, and interactions.
- Preserve all existing screens and flows unless the user explicitly drops them.
- Treat original HTML/CSS/JS as visual/behavioral source of truth.
- Treat product skill / Claude scope as product-rule source of truth when they constrain fields, menu, and statuses.
- Reuse assets and inline SVG paths from the original.
- Prefer reusable React components only when the same pattern appears on multiple pages.
- Use Tailwind utilities for most styling; map CSS variables into the Tailwind theme.
- Keep custom CSS for cases Tailwind cannot match cleanly (pseudo elements, split-table group headers, scan frame line, etc.).
- Prefer conventional React: props, local state, simple hooks, React Router.
- Keep logic next to the page that uses it.
- Name files after screens (`TicketList.jsx`, not `TicketsContainerView`).
- Validate each migrated page against the original HTML side-by-side.
- Update MEMORY.md when finishing a phase or making a decision.
- Keep documentation (PR, ARCHITECTURE, RULES, DESIGN, PHASES, SKILLS) accurate.
- Leave `parking_maintenance` (original path) **read-only**.

## What to avoid

- No redesign, modernization, or “AI default” aesthetic.
- No purple gradients, cream+serif trends, or unrelated design systems.
- No unnecessary libraries or state managers.
- No modifying the original source project.
- No inventing APIs or features not in original or explicitly requested.
- Login / session were approved in Phase 10. Phase 11 adds self-signup (Pending → admin approve), forgot/reset password UI, and admin change-password via existing APIs. Do not add OTP or third-party auth without asking.
- No reintroducing stripped features (inventory, SLA maps, SIM/battery fields, issue codes, etc.).
- No turning flow screens into top-level menu items.
- No merging multiple screens into one page.
- No excessive componentization (one wrapper per DOM node).
- No deep abstraction layers, magic helpers, or AI-only architecture.
- No silent swallowing of errors; match original toast/empty behavior.
- No changing business copy or sample data meaning without reason.

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

## Backend rules (Phase 11+)

- Analyze existing APIs before modifying them.
- Reuse existing services and utilities (`lib/auth.ts` hashing, reset tokens, `PATCH /api/users`).
- Preserve existing API contracts where possible.
- Do not rewrite working authentication logic.
- Do not duplicate password or authorization logic.
- Do not create unnecessary endpoints or database structures.
- Keep changes small, targeted, readable, and manually maintainable.

## Optimization rules

- Write the minimum code required; avoid unnecessary abstractions and dependencies.
- Avoid duplicate validation, queries, and authorization checks.
- Reuse existing error handling (`ApiError` / `handleApiError`).
- Do not perform unrelated refactoring.

## Security rules

- Never store plaintext passwords; reuse bcrypt via `hashPassword` / `verifyPassword`.
- Protect approval and admin password-change with existing `authorize('Users', …)`.
- Validate reset tokens; respect expiration; do not return tokens in API responses.
- Do not expose whether an email exists on forgot-password (generic message).
- Do not allow unauthorized role changes or self-approval.

**READ-ONLY** on:

`C:\Users\MTPC-359\Desktop\Project\parking_device_maintenance\parking_maintenance`

No writes, deletes, installs, or formatters against that tree.
