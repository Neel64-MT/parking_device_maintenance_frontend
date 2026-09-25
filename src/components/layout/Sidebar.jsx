import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP, MENU, SETTINGS, filterMenuByView, isMenuItemOn } from '../../config/nav'
import { NavIcon } from '../icons/NavIcons'
import { BrandMark } from '../ui/BrandMark'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../context/PageMetaContext'
import { canPerm } from '../../services/users'

function displayCount(value) {
  const count = Number(value) || 0
  return count > 99 ? '99+' : String(count)
}

function unreadLabel(label, count) {
  return count > 0 ? `${label}, ${count} unread notification${count === 1 ? '' : 's'}` : label
}

function NotificationBadge({ count }) {
  if (!count) return null
  return (
    <span className="nav-notification-count" aria-hidden="true">
      {displayCount(count)}
    </span>
  )
}

export function Sidebar({
  open,
  onNavigate,
  collapsed = false,
  opening = false,
  closing = false,
  onCloseTransitionEnd,
  unreadCount = 0,
}) {
  const { pageId } = usePageMeta()
  const { user } = useAuth()
  /** Manual open/close overrides; unset keys fall back to “child page is active”. */
  const [expanded, setExpanded] = useState({})

  const menu = filterMenuByView(MENU, (screen) => canPerm(user, screen, 'v'))

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

  function handleTransitionEnd(e) {
    if (!closing || !onCloseTransitionEnd) return
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'transform') return
    onCloseTransitionEnd()
  }

  return (
    <aside
      className={`rail${open ? ' show' : ''}${opening ? ' is-opening' : ''}${closing ? ' is-closing' : ''}${collapsed ? ' collapsed' : ''}`}
      id="rail"
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="brand">
        <div className="brand-mark">
          <BrandMark size={36} />
          <div className="brand-text">
            <h1>{APP.nameLines.join(' ')}</h1>
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
                  aria-label={m.id === 'ticket-list' ? unreadLabel(m.label, unreadCount) : tip ? m.label : undefined}
                >
                  <NavIcon name={m.icon} />
                  <span className="nav-label">{m.label}</span>
                  {m.id === 'ticket-list' ? <NotificationBadge count={unreadCount} /> : null}
                </Link>
              </div>
            )
          }

          const groupOpen = !collapsed && isGroupOpen(index, m)
          const isTicketsGroup = m.label === 'Tickets'
          return (
            <div key={m.label} className={`nav-group${groupOpen ? ' open' : ''}`}>
              <button
                type="button"
                className={isTicketsGroup ? 'tickets-nav' : undefined}
                onClick={() => toggleGroup(index, m)}
                title={tip ? unreadLabel(m.label, unreadCount) : undefined}
                aria-label={unreadLabel(m.label, unreadCount)}
                aria-expanded={groupOpen}
              >
                <NavIcon name={m.icon} />
                <span className="nav-label">{m.label}</span>
                {isTicketsGroup ? (
                  <span className="nav-group-tail">
                    <NotificationBadge count={unreadCount} />
                    <span className="nav-group-chevron" aria-hidden="true" />
                  </span>
                ) : null}
              </button>
              <div className="nav-sub">
                <div className="nav-sub-inner">
                  {m.children.map((c) => (
                    <Link
                      key={c.id}
                      to={c.path}
                      className={isMenuItemOn(c, pageId) ? 'active' : undefined}
                      onClick={onNavigate}
                      aria-label={c.id === 'ticket-list' ? unreadLabel(c.label, unreadCount) : undefined}
                    >
                      {c.icon ? <NavIcon name={c.icon} /> : null}
                      <span className="nav-label">{c.label}</span>
                      {c.id === 'ticket-list' ? <NotificationBadge count={unreadCount} /> : null}
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
          className={`rail-foot nav-item${isMenuItemOn(SETTINGS, pageId) ? ' active' : ''}`}
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
      </div>
    </aside>
  )
}
