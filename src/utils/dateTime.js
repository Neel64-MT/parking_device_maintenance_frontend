/** Local time split for table cells: { date: 'DD/MM/YYYY', time: 'HH:MM AM/PM' }; null when empty or invalid. */
export function dateTimeParts(value) {
  if (value == null || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')
  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${minutes}\u00a0${ampm}` }
}

/** Local time: DD/MM/YYYY at HH:MM AM/PM */
export function formatDateTime(value) {
  if (value == null || value === '') return value
  const parts = dateTimeParts(value)
  return parts ? `${parts.date} at ${parts.time}` : String(value)
}

/** WhatsApp time of a ticket / update row, or its created time when it did not come from WhatsApp. */
export function whatsappTime(row) {
  return row?.whatsappAt || row?.createdAt || null
}

/** `<input type="datetime-local">` value (local time) as an ISO string; empty = undefined. */
export function localInputToIso(value) {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

/** Current local time as a `datetime-local` value (YYYY-MM-DDTHH:MM). */
export function localInputNow() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
