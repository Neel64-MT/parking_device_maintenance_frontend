import { dateTimeParts, whatsappTime } from '../../utils/dateTime'

/** Table cell content: date with the time underneath, or a dash when there is no value. */
export function DateTimeCell({ value }) {
  const parts = dateTimeParts(value)
  if (!parts) return <span className="muted">—</span>
  return (
    <>
      {parts.date}
      <div className="muted">{parts.time}</div>
    </>
  )
}

/** Table cell content: WhatsApp time of a ticket row, or its created time when not from WhatsApp. */
export function WhatsappTimeCell({ row }) {
  return <DateTimeCell value={whatsappTime(row)} />
}
