# MEMORY.md — Migration Progress

## Completed

- [x] Phases 0–9 — HTML → React design-preview migration.
- [x] **Phase 10 — Auth** (login / JWT / RequireAuth).
- [x] **Phase 11 — Signup approval, forgot/reset UI, admin password**
  - Migration `005_user_pending_status.sql` (`Pending` status; existing Active unchanged)
  - `POST /api/auth/signup` → Pending + Site attendant; no JWT
  - Login: password OK then `PENDING_APPROVAL` / `INACTIVE` / token
  - `GET /api/users?status=` + roleId in list; Approve/Password via existing PATCH
  - FE: Signup form, Forgot/Reset pages, Login link, Users live list
  - Smoke: signup → pending block → approve → login; forgot/reset; admin password; PM forbidden
  - Frontend lint + build clean

## Currently working on

- **Phase:** Phase 11 complete.
- **Task:** —
- **File:** —

## Pending

- Wire remaining domain screens to backend APIs
- UI menu filtering by role permissions
- Live camera QR
- Roles tab on Users still mostly preview matrix (list API available)

## Important decisions

1–11. Prior phases (filters UI-only, static detail samples, responsive, Phase 10 JWT).
12. Reuse `users.status` with `Pending` (no new table). Existing users stay Active.
13. Signup default role = Site attendant; Admin sets role on approve via PATCH.
14. Forgot/reset: reuse existing token/email APIs (FE pages only).
15. Admin change password: reuse `PATCH /api/users/:id` `{ password }` (Users edit).
16. Pending login message: *"Please ask the admin to approve your request."* (`PENDING_APPROVAL`).

## Known issues / gaps

| Gap | Detail |
|-----|--------|
| Domain screens | Still mostly mock `src/data/` except auth + Users list |
| Roles tab | Permission matrix save still toast/preview |
| Forgot SMTP | Dev logs reset URL when SMTP unset |

## Handoff notes

Run `npm run db:migrate` in `../backend` before testing. Admin seed: `9000000001` / `Password123`. Do not write into `parking_maintenance/`.
