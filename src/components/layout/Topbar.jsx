import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../context/PageMetaContext'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { NavIcon } from '../icons/NavIcons'

/** Animated hamburger ↔ X (menuOpen = true shows X). */
function MenuToggleIcon({ open }) {
  return (
    <span className={`menu-toggle-icon${open ? ' is-open' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

export function Topbar({ onMenuClick, menuOpen = false }) {
  const { title, crumb, actions } = usePageMeta()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const name = user?.name || '—'
  const role = user?.role || ''
  const initials = user?.initials || '—'

  function openConfirm() {
    if (loggingOut) return
    setConfirmOpen(true)
  }

  function closeConfirm() {
    if (loggingOut) return
    setConfirmOpen(false)
  }

  async function confirmLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      setConfirmOpen(false)
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <header className="topbar" id="topbar">
        <button
          type="button"
          className={`menu-btn${menuOpen ? ' is-open' : ''}`}
          id="railToggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="rail"
          onClick={onMenuClick}
        >
          <MenuToggleIcon open={menuOpen} />
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
            onClick={openConfirm}
            disabled={loggingOut}
            aria-label="Log out"
            title="Log out"
          >
            <NavIcon name="logout" className="ico who-logout-ico" />
          </button>
        </div>
      </header>

      <Modal
        open={confirmOpen}
        title="Log out?"
        subtitle="You will need to sign in again to continue."
        onClose={closeConfirm}
      >
        <p className="muted" style={{ marginBottom: 16 }}>
          Are you sure you want to log out of Parking Device Maintenance?
        </p>
        <div className="modal-actions">
          <Button type="button" onClick={closeConfirm} disabled={loggingOut}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmLogout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
