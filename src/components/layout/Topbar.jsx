import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../context/PageMetaContext'
import { NavIcon } from '../icons/NavIcons'

export function Topbar({ onMenuClick, railOpen = false }) {
  const { title, crumb, actions } = usePageMeta()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const name = user?.name || '—'
  const role = user?.role || ''
  const initials = user?.initials || '—'

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="topbar" id="topbar">
      <button
        type="button"
        className="menu-btn"
        id="railToggle"
        aria-label={railOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={railOpen}
        aria-controls="rail"
        onClick={onMenuClick}
      >
        <NavIcon name="menu" />
      </button>

      <div className="topbar-title">
        <h2>{title}</h2>
        {crumb ? <div className="crumb">{crumb}</div> : null}
      </div>

      <div className="spacer" />

      <div className="topbar-actions" id="topbarActions">
        {actions}
      </div>

      <div className="who" aria-label={`${name}, ${role}`}>
        <div className="avatar" aria-hidden="true">
          {initials}
        </div>
        <span className="who-text">
          {name}
          <small>{role}</small>
        </span>
        <button
          type="button"
          className="who-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Log out"
        >
          {loggingOut ? '…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
