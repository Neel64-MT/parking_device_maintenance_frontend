# Parking Device Maintenance — React frontend

Design-preview migration of the vanilla HTML/CSS/JS site at  
`parking_maintenance/` → **React + Vite + Tailwind v4 + React Router**.

This is a **migration, not a redesign**. Visuals and interactions match the original preview; there is no backend yet.

## Scripts

```bash
npm install
npm run dev      # local preview
npm run build    # production build
npm run lint     # ESLint (ignores dist / .vite)
```

## Routes (15 screens)

| Path | Screen |
|------|--------|
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
- **Product rules:** `SKILL.md`

Do not modify the original `parking_maintenance` tree.
