import { Link } from 'react-router-dom'

/**
 * “Go to” pill strip — .jump
 * @param {{ label?: string, links: { to: string, label: string }[] }} props
 */
export function JumpLinks({ label = 'Go to', links }) {
  return (
    <div className="jump">
      <span className="jump-label">{label}</span>
      <div className="jump-links">
        {links.map((l) => (
          <Link key={l.to + l.label} to={l.to}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
