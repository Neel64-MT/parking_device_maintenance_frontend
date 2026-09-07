import { Link, useLocation } from 'react-router-dom'

/**
 * “Go to” pill strip — .jump
 * Optional `actions` render on the right (e.g. Scan QR / Add device).
 * Links pass `state.from` so destination Cancel can return here.
 */
export function JumpLinks({ label = 'Go to', links, actions = null }) {
  const location = useLocation()
  const from = `${location.pathname}${location.search}`

  return (
    <div className={`jump${actions ? ' jump-row' : ''}`}>
      <span className="jump-label">{label}</span>
      <div className="jump-links">
        {links.map((l) => (
          <Link key={l.to + l.label} to={l.to} state={l.state ?? { from }}>
            {l.label}
          </Link>
        ))}
      </div>
      {actions ? <div className="jump-actions">{actions}</div> : null}
    </div>
  )
}
