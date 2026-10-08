import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'
import { NavIcon } from '../icons/NavIcons'
import { NotificationItem } from '../notifications/NotificationItem'

function displayCount(value) {
  const count = Number(value) || 0
  return count > 99 ? '99+' : String(count)
}

export function NotificationBell({ notificationState }) {
  const {
    eligible,
    items,
    unreadCount,
    listLoaded,
    listLoading,
    listError,
    loadNotifications,
    openNotification,
    markAllRead,
  } = notificationState
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  /* Already on /notifications: keep the original page so Back never points at itself. */
  const viewAllState =
    location.pathname === '/notifications'
      ? location.state
      : { from: `${location.pathname}${location.search}` }

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open && !listLoaded && !listLoading) void loadNotifications()
  }, [listLoaded, listLoading, loadNotifications, open])

  if (!eligible) return null

  const count = Number(unreadCount) || 0
  const countLabel = count ? `${count} unread notification${count === 1 ? '' : 's'}` : 'No unread notifications'

  return (
    <div className="notification-control" ref={rootRef}>
      <button
        type="button"
        className="notification-trigger"
        aria-label={`Notifications: ${countLabel}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <NavIcon name="bell" className="ico notification-bell-icon" />
        {count > 0 ? <span className="notification-count">{displayCount(count)}</span> : null}
      </button>

      {open ? (
        <div className="notification-popover" role="dialog" aria-label="Notifications">
          <div className="notification-popover-head">
            <div>
              <h3>Notifications</h3>
              <p>{count ? `${count} unread` : 'You are all caught up'}</p>
            </div>
            {count > 0 ? (
              <Button type="button" size="sm" onClick={markAllRead} disabled={notificationState.pushBusy}>
                Mark all read
              </Button>
            ) : null}
          </div>

          {notificationState.preferences?.pushNotificationsEnabled &&
          notificationState.permission === 'default' &&
          notificationState.pushState !== 'unsupported' &&
          notificationState.pushState !== 'unavailable' ? (
            <p className="notification-settings-hint">
              <Link to="/settings" onClick={() => setOpen(false)}>
                Turn on browser alerts in Settings
              </Link>
            </p>
          ) : null}

          <div className="notification-list" aria-live="polite">
            {listLoading && !listLoaded ? <p className="muted">Loading notifications…</p> : null}
            {listError ? <p className="notification-error">{listError}</p> : null}
            {!listLoading && listLoaded && !items.length ? (
              <p className="muted notification-empty">No notifications yet.</p>
            ) : null}
            {items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onOpen={(next) => {
                  setOpen(false)
                  void openNotification(next)
                }}
              />
            ))}
          </div>

          {listLoaded ? (
            <div className="notification-popover-foot">
              <Link to="/notifications" state={viewAllState} onClick={() => setOpen(false)}>
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
