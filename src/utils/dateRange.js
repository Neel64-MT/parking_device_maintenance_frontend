/** Must match the backend `MAX_REPORT_DAYS` (src/lib/report-range.ts). */
export const MAX_RANGE_DAYS = 366

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'Current Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: '3 Months' },
  { value: 'last6Months', label: '6 Months' },
  { value: 'custom', label: 'Custom range' },
]

// Calendar arithmetic on 'YYYY-MM-DD' strings through UTC midnight, so no timezone or DST drift.
const toDate = (ymd) => new Date(`${ymd}T00:00:00Z`)
const toYmd = (d) => d.toISOString().slice(0, 10)

function addDays(ymd, days) {
  const d = toDate(ymd)
  d.setUTCDate(d.getUTCDate() + days)
  return toYmd(d)
}

/** Same day `months` earlier, clamped to that month's last day (31 Mar − 1 month → 28/29 Feb). */
function subtractMonths(ymd, months) {
  const d = toDate(ymd)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - months)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, lastDay))
  return toYmd(d)
}

/** Monday of the week containing `ymd` (weeks run Monday–Sunday). */
function weekStart(ymd) {
  const offset = (toDate(ymd).getUTCDay() + 6) % 7
  return addDays(ymd, -offset)
}

const monthStart = (ymd) => `${ymd.slice(0, 7)}-01`

/** { from, to } for a preset, relative to `today` (IST 'YYYY-MM-DD'). Custom keeps nothing. */
export function presetRange(preset, today) {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'thisWeek':
      return { from: weekStart(today), to: today }
    case 'lastWeek': {
      const start = addDays(weekStart(today), -7)
      return { from: start, to: addDays(start, 6) }
    }
    case 'thisMonth':
      return { from: monthStart(today), to: today }
    case 'lastMonth': {
      const end = addDays(monthStart(today), -1)
      return { from: monthStart(end), to: end }
    }
    case 'last3Months':
      return { from: subtractMonths(today, 3), to: today }
    case 'last6Months':
      return { from: subtractMonths(today, 6), to: today }
    default:
      return null
  }
}

/** The preset that produces exactly this range today, else 'custom'. */
export function detectPreset(from, to, today) {
  const match = DATE_PRESETS.find((p) => {
    const r = presetRange(p.value, today)
    return r && r.from === from && r.to === to
  })
  return match ? match.value : 'custom'
}

/** Whole days from `from` to `to`, both included. */
export function rangeDayCount(from, to) {
  return Math.round((toDate(to) - toDate(from)) / 86400000) + 1
}

/** First problem with a range, or '' when it can be requested. */
export function validateRange(from, to, today) {
  if (!from || !to) return 'Choose both a From and a To date.'
  if (from > to) return 'From date must be on or before To date.'
  if (to > today) return 'To date cannot be after today.'
  if (rangeDayCount(from, to) > MAX_RANGE_DAYS) return `Date range cannot be longer than ${MAX_RANGE_DAYS} days.`
  return ''
}
