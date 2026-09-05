import { Link } from 'react-router-dom'

/**
 * “Go to” pill strip — .jump
 * Optional `actions` render on the right (e.g. Scan QR / Add device).
 */
export function JumpLinks({ label = 'Go to', links, actions = null }) {
  return (
    <div className={`jump${actions ? ' jump-row' : ''}`}>
      <span className="jump-label">{label}</span>
      <div className="jump-links">
        {links.map((l) => (
          <Link key={l.to + l.label} to={l.to}>
            {l.label}
          </Link>
        ))}
      </div>
      {actions ? <div className="jump-actions">{actions}</div> : null}
    </div>
  )
}
