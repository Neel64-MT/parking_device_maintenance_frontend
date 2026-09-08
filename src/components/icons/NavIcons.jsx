/**
 * Nav icons — unique stroke icons for each sidebar item.
 * All share a 24×24 viewBox and consistent stroke weight via .ico CSS.
 */

const PATHS = {
  /* Dashboard — 2×2 overview tiles */
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.4" />
    </>
  ),

  /* Tickets — perforated ticket stub */
  ticket: (
    <>
      <path d="M5.5 5.5h13a1.5 1.5 0 0 1 1.5 1.5v3.2a2.2 2.2 0 0 0 0 4.4V17a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17v-2.4a2.2 2.2 0 0 0 0-4.4V7A1.5 1.5 0 0 1 5.5 5.5z" />
      <path d="M10 8.5v7M13.5 8.5v7" />
    </>
  ),

  /* Devices — parking barrier housing + striped boom (not a key) */
  device: (
    <>
      <rect x="3.5" y="4.5" width="6" height="13" rx="1.2" />
      <path d="M2.5 20.5h8" />
      <path d="M9.5 8.5H21" />
      <path d="M13 8.5l1.6 3.2M16.2 8.5l1.6 3.2M19.4 8.5l1.4 2.8" />
    </>
  ),

  /* Masters — stacked database / master-data cylinders (shifted up for optical center) */
  master: (
    <>
      <ellipse cx="12" cy="5" rx="7" ry="2.4" />
      <path d="M5 5v3.8c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V5" />
      <path d="M5 8.8v3.8c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4V8.8" />
      <path d="M5 12.6v3.8c0 1.3 3.1 2.4 7 2.4s7-1.1 7-2.4v-3.8" />
    </>
  ),

  /* Users — person */
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5" />
    </>
  ),

  /* Settings — classic gear with center hole */
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),

  /* Sub-menu: all tickets — bullet list (distinct from ticket stub) */
  'ticket-list': (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),

  /* Sub-menu: work report — clipboard with lines + mini bars (not dashboard tiles) */
  report: (
    <>
      <rect x="5.5" y="5" width="13" height="16" rx="1.5" />
      <path d="M9.5 5V3.8A1.3 1.3 0 0 1 10.8 2.5h2.4A1.3 1.3 0 0 1 14.5 3.8V5" />
      <path d="M8.5 10h7M8.5 13h5" />
      <path d="M9 18.5v-2.8M12 18.5v-4.2M15 18.5v-3.4" />
    </>
  ),

  /* Sub-menu: Issue — alert triangle + exclamation (optically centered) */
  issue: (
    <>
      <path d="M12 4.5 20.5 19.2H3.5L12 4.5z" />
      <path d="M12 10.2v4" />
      <path d="M12 16.6h.01" />
    </>
  ),

  /* Sub-menu: Road — perspective roadway with dashed lane + edge */
  road: (
    <>
      <path d="M8 3.5 3.5 20.5h17L16 3.5H8z" />
      <path d="M12 7v2.2M12 12v2.4M12 17.2v2" />
    </>
  ),

  /* Sub-menu: Parts — large hex nut (spare-part silhouette; not Settings gear) */
  parts: (
    <>
      <path d="M19.8 7.5 12 3 4.2 7.5v9L12 21l7.8-4.5z" />
      <circle cx="12" cy="12" r="4.2" />
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
