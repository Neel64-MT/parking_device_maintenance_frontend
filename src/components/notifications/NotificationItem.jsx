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

/**
 * One notification row, shared by the navbar bell popover and the Notifications page.
 * @param {{ item: object, onOpen: (item: object) => void }} props
 */
export function NotificationItem({ item, onOpen }) {
  const isSignup = item.type === 'user.signup_requested'
  const fallbackLabel = isSignup ? 'Account request' : 'Ticket notification'
  const ticketLabel = item.data?.ticketId || item.data?.reference || fallbackLabel
  const context = (
    isSignup
      ? [item.data?.applicant?.mobile, item.data?.applicant?.email]
      : [
          item.data?.device?.road,
          item.data?.issue?.subCategory || item.data?.issue?.category,
          notificationAttribution(item),
        ]
  ).filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      className={`notification-item${item.isRead ? '' : ' unread'}`}
      onClick={() => onOpen(item)}
    >
      <span className="notification-item-topline">
        <strong>{item.title || fallbackLabel}</strong>
        {!item.isRead ? <span className="notification-unread-dot" aria-label="Unread" /> : null}
      </span>
      <span className="notification-item-ticket">{ticketLabel}</span>
      <span className="notification-item-message">{item.message}</span>
      {context ? <span className="notification-item-context">{context}</span> : null}
      {item.createdAt ? <small>{formatTime(item.createdAt)}</small> : null}
    </button>
  )
}
