import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { NavIcon } from '../icons/NavIcons'

function displayCount(value) {
  const count = Number(value) || 0
  return count > 99 ? '99+' : String(count)
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Attribution line for one notification.
 * `ticket.raised` payloads carry `data.raisedBy`; `ticket.assigned` /
 * `ticket.reassigned` carry `data.assignedBy` instead. Raised is checked first so
 * existing new-ticket rows render exactly as before, and a payload with neither
 * simply omits the line rather than leaving a dangling separator.
 */
function notificationAttribution(item) {
  const raisedBy = item?.data?.raisedBy?.name
  if (raisedBy) return `Raised by ${raisedBy}`
  const assignedBy = item?.data?.assignedBy?.name
  if (assignedBy) return `Assigned by ${assignedBy}`
  return ''
}

export function NotificationBell({ notificationState }) {
  const {
    eligible,
    items,
    pagination,
    unreadCount,
    listLoaded,
    listLoading,
    listError,
    loadNotifications,
    openNotification,
    markAllRead,
  } = notificationState
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

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
            {items.map((item) => {
              const ticketLabel = item.data?.ticketId || item.data?.reference || 'Ticket notification'
              const context = [
                item.data?.device?.road,
                item.data?.issue?.subCategory || item.data?.issue?.category,
                notificationAttribution(item),
              ].filter(Boolean).join(' · ')
              return (
                <button
                  type="button"
                  className={`notification-item${item.isRead ? '' : ' unread'}`}
                  key={item.id}
                  onClick={() => {
                    setOpen(false)
                    void openNotification(item)
                  }}
                >
                  <span className="notification-item-topline">
                    <strong>{item.title || 'Ticket notification'}</strong>
                    {!item.isRead ? <span className="notification-unread-dot" aria-label="Unread" /> : null}
                  </span>
                  <span className="notification-item-ticket">{ticketLabel}</span>
                  <span className="notification-item-message">{item.message}</span>
                  {context ? <span className="notification-item-context">{context}</span> : null}
                  {item.createdAt ? <small>{formatTime(item.createdAt)}</small> : null}
                </button>
              )
            })}
          </div>

          {pagination?.total > items.length ? (
            <p className="notification-footnote">Showing the latest {items.length} of {pagination.total}.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
