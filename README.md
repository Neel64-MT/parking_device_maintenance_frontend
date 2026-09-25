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

## Browser notifications

The frontend consumes the backend's existing `ticket.raised` notification and VAPID Web Push APIs. Browser push is opt-in:

1. Sign in as an eligible `Admin`, `Project manager`, or `Control room` user with **All tickets → View** access.
2. Open the bell in the topbar and choose **Enable** under Browser notifications.
3. Approve the browser's native permission prompt.
4. The frontend registers the browser subscription through the backend; the same backend unread count appears on the bell, Tickets, and All tickets.

`default` permission is never requested on page load. `denied` permission shows browser-settings guidance without repeatedly prompting. If VAPID is not configured, in-app notifications and unread badges remain available but background browser push is disabled. Web Push requires a secure context (`https://` or localhost) and a supported browser.

Notification clicks use the existing `/tickets/:ticketId` route. Opening a notification marks its notification record read through the backend; the existing ticket authorization/404 handling still applies. When a new notification arrives, the page attempts to play `public/sounds/elevenlabs-achievement-unlock.mp3`, including when the app tab is open in the background; browser autoplay policy may require a prior user interaction.

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
