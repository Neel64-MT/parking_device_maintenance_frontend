import { APP } from '../../config/nav'
import { NavIcon } from '../icons/NavIcons'
import { usePageMeta } from '../../context/PageMetaContext'

export function Topbar({ onMenuClick, railOpen = false }) {
  const { title, crumb, actions } = usePageMeta()

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

      <div className="who" aria-label={`${APP.user.name}, ${APP.user.role}`}>
        <div className="avatar" aria-hidden="true">
          {APP.user.initials}
        </div>
        <span className="who-text">
          {APP.user.name}
          <small>{APP.user.role}</small>
        </span>
      </div>
    </header>
  )
}
