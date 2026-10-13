const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FENCE = '```'
const RULE_TAIL_MAX = 18

/** 'YYYY-MM-DD' → '13 Oct 2026' without going through a Date (no timezone shift). */
export function formatReportDate(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number)
  if (!y || !m || !d) return String(ymd || '')
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`
}

/** ISO timestamp → '13 Oct 2026, 03:45 PM IST'. */
export function formatIstStamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toUpperCase()} IST`
}

/**
 * Fixed-width table. Every column but the last is padded to its widest cell; the last
 * column is left free so a long value wraps on a phone without breaking the alignment.
 */
function table(headers, rows, align = []) {
  const widths = headers.map((h, i) =>
    i === headers.length - 1 ? 0 : Math.max(h.length, ...rows.map((r) => String(r[i]).length)),
  )
  const cell = (v, i) => {
    if (i === headers.length - 1) return String(v)
    return align[i] === 'right' ? String(v).padStart(widths[i]) : String(v).padEnd(widths[i])
  }
  const line = (cells) => cells.map(cell).join(' | ').trimEnd()
  const head = line(headers)
  const last = headers.length - 1
  const fixed = widths.slice(0, last).reduce((n, w) => n + w + 3, 0)
  const lastWidth = Math.min(RULE_TAIL_MAX, Math.max(headers[last].length, ...rows.map((r) => String(r[last]).length)))
  const rule = '-'.repeat(fixed + lastWidth)
  return [FENCE, head, rule, ...rows.map(line), FENCE].join('\n')
}

const slotIdText = (slotId) => (slotId == null ? '-' : String(slotId))

/** Shareable plain-text EOD report built only from the backend response. */
export function buildEodReportText(report) {
  const date = formatReportDate(report.date)
  const { summary } = report
  const out = [
    'PARKING DEVICE MANAGEMENT',
    'END OF DAY REPORT',
    `Date: ${date}`,
    `Generated: ${formatIstStamp(report.generatedAt)}`,
    '',
    'DAILY SUMMARY',
    [
      FENCE,
      `Tickets raised      : ${summary.ticketsRaised}`,
      `Tickets completed   : ${summary.ticketsClosed}`,
      `Users who raised    : ${summary.usersRaised}`,
      `Users who completed : ${summary.usersClosed}`,
      FENCE,
    ].join('\n'),
    '',
    'USER-WISE ACTIVITY',
    report.users.length
      ? table(
          ['User', 'Raised', 'Completed', 'Slots'],
          report.users.map((u) => [u.userName, u.raised, u.closed, u.slots.join(', ') || '-']),
          [null, 'right', 'right'],
        )
      : `No ticket activity on ${date}`,
    '',
    'TICKETS RAISED',
    report.raised.length
      ? table(
          ['Ticket', 'Slot ID', 'Slot Label', 'Raised by'],
          report.raised.map((t) => [t.ticketId, slotIdText(t.slotId), t.slotLabel || '-', t.userName]),
        )
      : `No tickets raised on ${date}`,
    '',
    'TICKETS COMPLETED',
    report.closed.length
      ? table(
          ['Ticket', 'Slot ID', 'Slot Label', 'Completed by'],
          report.closed.map((t) => [t.ticketId, slotIdText(t.slotId), t.slotLabel || '-', t.userName]),
        )
      : `No tickets completed on ${date}`,
  ]
  return out.join('\n')
}
