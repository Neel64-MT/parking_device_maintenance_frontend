import { useEffect, useRef, useState } from 'react'
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

function PushStatus({ notificationState }) {
  const {
    permission,
    pushConfig,
    pushState,
    pushBusy,
    pushError,
    enablePush,
    disablePush,
  } = notificationState

  let title = 'Browser notifications'
  let message
  let action = null

  if (pushState === 'unsupported' || permission === 'unsupported') {
    message = 'This browser does not support background notifications. In-app alerts are still available.'
  } else if (permission === 'denied' || pushState === 'denied') {
    message = 'Browser notifications are blocked. Allow notifications for this site in your browser settings.'
  } else if (pushState === 'unavailable' || pushConfig?.available === false) {
    message = 'Browser push is not configured for this deployment. In-app alerts are still available.'
  } else if (pushState === 'conflict') {
    message = 'This browser is registered to another account. Sign out of that account before enabling alerts here.'
  } else if (pushState === 'enabled') {
    message = 'Browser notifications are enabled for this device.'
    action = (
      <Button type="button" size="sm" onClick={disablePush} disabled={pushBusy}>
        {pushBusy ? 'Turning off…' : 'Turn off'}
      </Button>
    )
  } else if (pushState === 'off') {
    message = 'Browser notifications are turned off for this device.'
    action = (
      <Button type="button" size="sm" onClick={enablePush} disabled={pushBusy}>
        {pushBusy ? 'Enabling…' : 'Turn on'}
      </Button>
    )
  } else if (pushState === 'error') {
    message = pushError || 'Browser notifications could not be enabled.'
    action = (
      <Button type="button" size="sm" onClick={enablePush} disabled={pushBusy}>
        {pushBusy ? 'Retrying…' : 'Retry'}
      </Button>
    )
  } else if (permission === 'default') {
    message = 'Allow browser notifications to receive new ticket alerts when this tab is closed.'
    action = (
      <Button type="button" size="sm" variant="primary" onClick={enablePush} disabled={pushBusy}>
        {pushBusy ? 'Enabling…' : 'Enable'}
      </Button>
    )
  } else {
    message = pushError || 'Browser notifications are not enabled for this device.'
    action = (
      <Button type="button" size="sm" onClick={enablePush} disabled={pushBusy}>
        {pushBusy ? 'Enabling…' : 'Enable'}
      </Button>
    )
  }

  return (
    <div className="notification-push-status">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {action}
    </div>
  )
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

          <PushStatus notificationState={notificationState} />

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
                item.data?.raisedBy?.name ? `Raised by ${item.data.raisedBy.name}` : '',
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
                    <strong>{item.title || 'New ticket raised'}</strong>
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
