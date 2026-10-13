import { useEffect, useState } from 'react'
import { Panel } from '../ui/Panel'
import { Tile } from '../ui/Tile'
import { SkeletonTable } from '../ui/Skeleton'
import { ApiRequestError } from '../../services/api'
import { getUserActivity } from '../../services/dashboard'
import { todayIstDate } from '../../utils/dateTime'
import { formatReportDate } from '../../utils/eodReportText'

/**
 * Tickets raised, updated and closed per user for an IST date range. The backend does all
 * counting; this panel only renders the rows and totals it returns.
 */
export function UserActivityPanel() {
  const today = todayIstDate()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const rangeError = from && to && from > to ? 'From date must be on or before To date.' : ''

  useEffect(() => {
    if (!from || !to || from > to) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await getUserActivity({ from, to })
        if (!cancelled) setData(result)
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(err instanceof ApiRequestError ? err.message : 'Could not load user activity.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [from, to])

  const shownError = rangeError || error
  const period =
    data && (data.from === data.to
      ? formatReportDate(data.from)
      : `${formatReportDate(data.from)} – ${formatReportDate(data.to)}`)

  return (
    <Panel
      className="eod-panel user-activity-panel"
      title="User-Wise Ticket Activity"
      subtitle={period ? `Tickets raised, updated and closed · ${period} (IST)` : 'Tickets raised, updated and closed (IST)'}
      flush
      actions={
        <>
          <input
            type="date"
            aria-label="Activity from date"
            value={from}
            max={today}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            aria-label="Activity to date"
            value={to}
            max={today}
            onChange={(e) => setTo(e.target.value)}
          />
        </>
      }
      foot="Updated = different tickets the user added an update to. Closed = tickets the user closed. Totals count each ticket once."
    >
      {shownError ? (
        <div className="hint-strip auth-error user-activity-error" role="alert">
          <span>{shownError}</span>
        </div>
      ) : null}

      {data && !shownError ? (
        <div className="tiles eod-tiles user-activity-tiles" aria-busy={loading}>
          <Tile value={data.summary.ticketsRaised} label="Total Tickets Raised" />
          <Tile value={data.summary.ticketsUpdated} label="Total Tickets Updated" tone="warn" />
          <Tile value={data.summary.ticketsClosed} label="Total Tickets Closed" tone="ok" />
        </div>
      ) : null}

      {!shownError ? (
        <div className="table-wrap" aria-busy={loading}>
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th className="num">Tickets Raised</th>
                <th className="num">Tickets Updated</th>
                <th className="num">Tickets Closed</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? <SkeletonTable rows={4} cols={4} /> : null}
              {data && !data.users.length ? (
                <tr>
                  <td colSpan={4}>
                    <span className="muted">No ticket activity in this period.</span>
                  </td>
                </tr>
              ) : null}
              {data
                ? data.users.map((u) => (
                    <tr key={u.userId ?? `none:${u.userName}`}>
                      <td>
                        {u.userName}
                        {u.role ? <div className="muted">{u.role}</div> : null}
                      </td>
                      <td className="num">{u.raised}</td>
                      <td className="num">{u.updated}</td>
                      <td className="num">{u.closed}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  )
}
