import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP, MENU, isMenuItemOn } from '../../config/nav'
import { NavIcon } from '../icons/NavIcons'
import { usePageMeta } from '../../context/PageMetaContext'

export function Sidebar({ open, onNavigate }) {
  const { pageId } = usePageMeta()
  /** Manual open/close overrides; unset keys fall back to “child page is active”. */
  const [expanded, setExpanded] = useState({})

  function isGroupOpen(index, item) {
    if (Object.prototype.hasOwnProperty.call(expanded, index)) {
      return expanded[index]
    }
    return item.children.some((c) => isMenuItemOn(c, pageId))
  }

  function toggleGroup(index, item) {
    const next = !isGroupOpen(index, item)
    setExpanded((prev) => ({ ...prev, [index]: next }))
  }

  return (
    <aside className={`rail${open ? ' show' : ''}`} id="rail">
      <div className="brand">
        <div className="brand-text">
          <div className="mark">
            <div className="glyph">P</div>
            <h1>
              {APP.nameLines[0]}
              <br />
              {APP.nameLines[1]}
            </h1>
          </div>
          <p>{APP.sub}</p>
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

      <nav className="nav">
        {MENU.map((m, index) => {
          if (!m.children) {
            const active = isMenuItemOn(m, pageId)
            return (
              <div key={m.id} className={`nav-item${active ? ' active' : ''}`}>
                <Link to={m.path} onClick={onNavigate}>
                  <NavIcon name={m.icon} />
                  {m.label}
                </Link>
              </div>
            )
          }

          const groupOpen = isGroupOpen(index, m)
          return (
            <div key={m.label} className={`nav-group${groupOpen ? ' open' : ''}`}>
              <button type="button" onClick={() => toggleGroup(index, m)}>
                <NavIcon name={m.icon} />
                {m.label}
              </button>
              <div className="nav-sub">
                {m.children.map((c) => (
                  <Link
                    key={c.id}
                    to={c.path}
                    className={isMenuItemOn(c, pageId) ? 'active' : undefined}
                    onClick={onNavigate}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="rail-foot">
        {APP.footerLines[0]}
        <br />
        {APP.footerLines[1]}
      </div>
    </aside>
  )
}
