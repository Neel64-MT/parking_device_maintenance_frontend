# Parking Device Maintenance — React frontend

Design-preview migration of the vanilla HTML/CSS/JS site at  
`parking_maintenance/` → **React + Vite + Tailwind v4 + React Router**.

This is a **migration, not a redesign**. Visuals match the original preview. Phase 10 adds login against the sibling backend.

## Scripts

```bash
npm install
npm run dev      # local preview (proxies /api → localhost:5000)
npm run build    # production build
npm run lint     # ESLint (ignores dist / .vite)
```

Start the API first:

```bash
cd ../backend
npm run dev      # http://localhost:5000
```

### Demo login (seed)

| Field | Value |
|-------|-------|
| Mobile | `9825012345` |
| Email | `alkesh.patel@pdm.local` |
| Password | `Password123` |

## Routes

| Path | Screen |
|------|--------|
| `/login` | Sign in (email or mobile + password) |
| `/signup` | Ask admin (no self-registration) |
| `/dashboard` | Dashboard |
| `/tickets` | All tickets |
| `/tickets/raise` · `/update` · `/close` · `/:id` · `/report` | Ticket flows + work report |
| `/devices` · `/add` · `/scan` · `/:id` | Device list, add, scan, history |
| `/masters/issues` · `/masters/roads` · `/masters/roads/add` | Masters |
| `/users` | Users & roles |
| `/dev/ui` | Shared UI scratch (not in menu) |

## Docs

`PR.md`, `Architecture.md`, `Rules.md`, `Design.md`, `Memory.md`, `Phases.md`, `SKILL.md` / `SKILLS.md`

## Source of truth

- **Original UI (read-only):** `../parking_maintenance/`
- **Backend API:** `../backend/` (port 5000)
- **Product rules:** `SKILL.md`

Do not modify the original `parking_maintenance` tree.
