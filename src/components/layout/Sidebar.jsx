import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP, MENU, SETTINGS, filterMenuByView, isMenuItemOn } from '../../config/nav'
import { NavIcon } from '../icons/NavIcons'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../context/PageMetaContext'
import { canPerm, isDashboardRole } from '../../services/users'

export function Sidebar({ open, onNavigate, collapsed = false }) {
  const { pageId } = usePageMeta()
  const { user } = useAuth()
  /** Manual open/close overrides; unset keys fall back to “child page is active”. */
  const [expanded, setExpanded] = useState({})

  const menu = filterMenuByView(MENU, (screen) => {
    if (screen === 'Dashboard' && !isDashboardRole(user)) return false
    return canPerm(user, screen, 'v')
  })

  function isGroupOpen(index, item) {
    if (Object.prototype.hasOwnProperty.call(expanded, index)) {
      return expanded[index]
    }
    return item.children.some((c) => isMenuItemOn(c, pageId))
  }

  function toggleGroup(index, item) {
    if (collapsed) return
    const next = !isGroupOpen(index, item)
    setExpanded((prev) => ({ ...prev, [index]: next }))
  }

  const tip = collapsed

  return (
    <aside className={`rail${open ? ' show' : ''}${collapsed ? ' collapsed' : ''}`} id="rail">
      <div className="brand">
        <div className="brand-mark">
          <div className="glyph" aria-hidden="true">
            P
          </div>
          <div className="brand-text">
            <h1>
              {APP.nameLines[0]}
              <br />
              {APP.nameLines[1]}
            </h1>
            <p>{APP.sub}</p>
          </div>
        </div>
        <button
          type="button"
          className="rail-close"
          aria-label="Close menu"
          onClick={onNavigate}
        >
          <NavIcon name="close" />
        </button>
      </div>

      <nav className="nav" aria-label="Main">
        {menu.map((m, index) => {
          if (!m.children) {
            const active = isMenuItemOn(m, pageId)
            return (
              <div key={m.id} className={`nav-item${active ? ' active' : ''}`}>
                <Link
                  to={m.path}
                  onClick={onNavigate}
                  title={tip ? m.label : undefined}
                  aria-label={tip ? m.label : undefined}
                >
                  <NavIcon name={m.icon} />
                  <span className="nav-label">{m.label}</span>
                </Link>
              </div>
            )
          }

          const groupOpen = !collapsed && isGroupOpen(index, m)
          return (
            <div key={m.label} className={`nav-group${groupOpen ? ' open' : ''}`}>
              <button
                type="button"
                onClick={() => toggleGroup(index, m)}
                title={tip ? m.label : undefined}
                aria-label={tip ? m.label : undefined}
                aria-expanded={groupOpen}
              >
                <NavIcon name={m.icon} />
                <span className="nav-label">{m.label}</span>
              </button>
              <div className="nav-sub">
                <div className="nav-sub-inner">
                  {m.children.map((c) => (
                    <Link
                      key={c.id}
                      to={c.path}
                      className={isMenuItemOn(c, pageId) ? 'active' : undefined}
                      onClick={onNavigate}
                    >
                      {c.icon ? <NavIcon name={c.icon} /> : null}
                      <span className="nav-label">{c.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="rail-bottom">
        <div
          className={`nav-item${isMenuItemOn(SETTINGS, pageId) ? ' active' : ''}`}
        >
          <Link
            to={SETTINGS.path}
            onClick={onNavigate}
            title={tip ? SETTINGS.label : undefined}
            aria-label={tip ? SETTINGS.label : undefined}
          >
            <NavIcon name={SETTINGS.icon} />
            <span className="nav-label">{SETTINGS.label}</span>
          </Link>
        </div>
        <div className="rail-foot">
          <span className="rail-foot-text">
            {APP.footerLines[0]}
            <br />
            {APP.footerLines[1]}
          </span>
        </div>
      </div>
    </aside>
  )
}
