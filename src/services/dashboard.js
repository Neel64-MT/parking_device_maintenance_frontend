import { api, ApiRequestError } from './api'

/** Dashboard payload (fleet / downReasons / roadStatus / crumb). Backend scopes ticket metrics. */
export async function getDashboard({ road = '', from = '', to = '' } = {}) {
  const params = new URLSearchParams()
  if (road) params.set('road', road)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return api(`/api/dashboard${qs ? `?${qs}` : ''}`)
}

/**
 * Tickets raised / updated / closed per user over IST days [from, to] (YYYY-MM-DD, both
 * inclusive). Counts and totals come from the backend; a malformed payload throws.
 */
export async function getUserActivity({ from, to }) {
  const data = await api(`/api/dashboard/user-activity?${new URLSearchParams({ from, to })}`)
  const s = data?.summary
  if (
    !data?.from ||
    !s ||
    ![s.ticketsRaised, s.ticketsUpdated, s.ticketsClosed].every(Number.isFinite) ||
    !Array.isArray(data.users)
  ) {
    throw new ApiRequestError('Unexpected user activity response')
  }
  return {
    from: String(data.from),
    to: String(data.to),
    summary: {
      ticketsRaised: s.ticketsRaised,
      ticketsUpdated: s.ticketsUpdated,
      ticketsClosed: s.ticketsClosed,
    },
    users: data.users,
  }
}

/**
 * EOD report for IST days [from, to] (YYYY-MM-DD, both inclusive; from = to for one day).
 * The backend computes every count; a malformed payload throws rather than turning into a
 * misleading zero report.
 */
export async function getEodReport({ from, to }) {
  const data = await api(`/api/dashboard/eod-report?${new URLSearchParams({ from, to })}`)
  const s = data?.summary
  if (
    !data?.from ||
    !data?.to ||
    !s ||
    ![s.ticketsRaised, s.ticketsClosed, s.usersRaised, s.usersClosed].every(Number.isFinite) ||
    !Array.isArray(data.raised) ||
    !Array.isArray(data.closed) ||
    !Array.isArray(data.users)
  ) {
    throw new ApiRequestError('Unexpected EOD report response')
  }
  return {
    date: String(data.from),
    from: String(data.from),
    to: String(data.to),
    timezone: String(data.timezone || 'Asia/Kolkata'),
    generatedAt: String(data.generatedAt || ''),
    summary: {
      ticketsRaised: s.ticketsRaised,
      ticketsClosed: s.ticketsClosed,
      usersRaised: s.usersRaised,
      usersClosed: s.usersClosed,
    },
    raised: data.raised,
    closed: data.closed,
    users: data.users.map((u) => ({ ...u, slots: Array.isArray(u.slots) ? u.slots : [] })),
  }
}
