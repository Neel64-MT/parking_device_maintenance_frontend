import { dateTimeParts, whatsappTime } from '../../utils/dateTime'

/** Table cell content: WhatsApp time of a ticket row, or its created time when not from WhatsApp. */
export function WhatsappTimeCell({ row }) {
  const parts = dateTimeParts(whatsappTime(row))
  if (!parts) return <span className="muted">—</span>
  return (
    <>
      {parts.date}
      <div className="muted">{parts.time}</div>
    </>
  )
}
