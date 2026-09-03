/** Nav icons — path data from original asset/nav.js ICON map */

const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </>
  ),
  ticket: (
    <>
      <path d="M12 8v5M12 16.5v.5" />
      <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </>
  ),
  device: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 9h8M8 14h5" />
    </>
  ),
  master: <path d="M4 6h16M4 12h16M4 18h10" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
}

export function NavIcon({ name, className = 'ico' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name] || null}
    </svg>
  )
}
