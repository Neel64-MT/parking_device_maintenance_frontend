import { APP } from '../../config/nav'
import { NavIcon } from '../icons/NavIcons'
import { usePageMeta } from '../../context/PageMetaContext'

export function Topbar({ onMenuClick }) {
  const { title, crumb, actions } = usePageMeta()

  return (
    <header className="topbar" id="topbar">
      <button
        type="button"
        className="menu-btn"
        id="railToggle"
        aria-label="Open menu"
        onClick={onMenuClick}
      >
        <NavIcon name="menu" />
      </button>

      <div>
        <h2>{title}</h2>
        {crumb ? <div className="crumb">{crumb}</div> : null}
      </div>

      <div className="spacer" />

      <div className="topbar-actions" id="topbarActions">
        {actions}
      </div>

      <div className="who">
        <div className="avatar">{APP.user.initials}</div>
        <span>
          {APP.user.name}
          <small>{APP.user.role}</small>
        </span>
      </div>
    </header>
  )
}
