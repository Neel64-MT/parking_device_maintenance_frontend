/**
 * Nav icons — unique stroke icons for each sidebar item.
 * All share a 24×24 viewBox and consistent stroke weight via .ico CSS.
 */

const PATHS = {
  /* Equal 2×2 tiles — dashboard overview */
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.4" />
    </>
  ),

  /* Ticket stub with side notches */
  ticket: (
    <>
      <path d="M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v3.2a2.2 2.2 0 0 0 0 4.4V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17v-2.4a2.2 2.2 0 0 0 0-4.4V7A1.5 1.5 0 0 1 5.5 5.5z" />
      <path d="M10 8.5v7M13.5 8.5v7" />
    </>
  ),

  /* Parking flap / barrier device */
  device: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8h8M8 12h5.5" />
      <circle cx="15.5" cy="15.5" r="1.6" />
      <path d="M8 16.5h4" />
    </>
  ),

  /* Master data — binder / reference book */
  master: (
    <>
      <path d="M7 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7" />
      <path d="M7 4.5A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5" />
      <path d="M10.5 9h6M10.5 12.5h6M10.5 16h4" />
    </>
  ),

  /* Users — person */
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5" />
    </>
  ),

  /* Settings — classic gear with center hole (matches reference) */
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  /* Sub-menu: ticket list */
  'ticket-list': (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),

  /* Sub-menu: work report / chart */
  report: (
    <>
      <path d="M4 19.5h16" />
      <path d="M7 16V10M12 16V6M17 16v-4" />
    </>
  ),

  /* Sub-menu: issue master — tags / categories */
  issue: (
    <>
      <path d="M12.5 4.5H7.2A1.7 1.7 0 0 0 5.5 6.2v5.3a1.7 1.7 0 0 0 .5 1.2l6.3 6.3a1.5 1.5 0 0 0 2.1 0l5.2-5.2a1.5 1.5 0 0 0 0-2.1l-6.3-6.3a1.7 1.7 0 0 0-1.2-.5z" />
      <circle cx="9" cy="9" r="1.1" />
    </>
  ),

  /* Sub-menu: road master */
  road: (
    <>
      <path d="M9 3.5 5.5 20.5M15 3.5l3.5 17" />
      <path d="M12 8v2.5M12 13.5V16" />
    </>
  ),

  'panel-left': (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M9.5 4v16" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  /* Log out — door with arrow */
  logout: (
    <>
      <path d="M10 4.5H6.5A2 2 0 0 0 4.5 6.5v11A2 2 0 0 0 6.5 19.5H10" />
      <path d="M14 12H21" />
      <path d="M18 8.5 21.5 12 18 15.5" />
    </>
  ),
}

export function NavIcon({ name, className = 'ico' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  )
}
