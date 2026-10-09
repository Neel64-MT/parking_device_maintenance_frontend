import { Link } from 'react-router-dom'
import { Pill } from '../ui/Pill'
import { SkeletonTable } from '../ui/Skeleton'
import { WhatsappTimeCell } from './WhatsappTimeCell'

/**
 * Ticket rows from GET /api/tickets (All tickets, Slot View). Markup matches the
 * original All tickets table; links open the existing Ticket Detail route.
 * `showSlot` = Slot Id + Road / slot columns (hidden where the page is already one slot).
 * `person` = which person column to show: raisedBy, assignedTo (Under repair) or closedBy (Closed).
 */
const PERSON_COLUMNS = {
  raisedBy: 'Raised by',
  assignedTo: 'Assigned to',
  closedBy: 'Closed by',
}

export function TicketTable({
  rows,
  loading,
  showDaysOpen = false,
  showDaysAfterClose = false,
  showSlot = true,
  person = 'raisedBy',
  linkState,
  emptyText = 'No tickets match this view.',
}) {
  const personKey = PERSON_COLUMNS[person] ? person : 'raisedBy'
  const colCount =
    8 + (showSlot ? 2 : 0) + (showDaysOpen ? 1 : 0) + (showDaysAfterClose ? 1 : 0)

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            {showSlot ? <th>Slot Id</th> : null}
            {showSlot ? <th>Road / slot</th> : null}
            <th>Issue reported</th>
            <th>Issue found</th>
            <th>{PERSON_COLUMNS[personKey]}</th>
            <th>Reported time</th>
            <th className="num">Updates</th>
            {showDaysOpen ? <th className="num">Days open</th> : null}
            {showDaysAfterClose ? <th className="num">Days After Close</th> : null}
            <th>Status</th>
            <th className="act" />
          </tr>
        </thead>
        <tbody>
          {loading ? <SkeletonTable rows={6} cols={colCount} /> : null}
          {!loading && !rows.length ? (
            <tr>
              <td colSpan={colCount}>
                <span className="muted">{emptyText}</span>
              </td>
            </tr>
          ) : null}
          {!loading
            ? rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link className="code" to={`/tickets/${row.id}`} state={linkState}>
                      {row.id}
                    </Link>
                  </td>
                  {showSlot ? (
                    <td>
                      <Link className="code" to={`/devices/${row.deviceId}`}>
                        {row.deviceId}
                      </Link>
                    </td>
                  ) : null}
                  {showSlot ? (
                    <td>
                      {row.road}
                      <div className="muted">{row.slot}</div>
                    </td>
                  ) : null}
                  <td>
                    {row.issueReported}
                    {row.issueReportedDetail ? (
                      <div className="muted">{row.issueReportedDetail}</div>
                    ) : null}
                  </td>
                  <td>
                    {row.issueFound ? (
                      <>
                        {row.issueFound}
                        {row.issueFoundDetail ? (
                          <div className="muted">{row.issueFoundDetail}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="muted">Not inspected yet</span>
                    )}
                  </td>
                  <td>
                    {row[personKey] || <span className="muted">—</span>}
                  </td>
                  <td>
                    <WhatsappTimeCell row={row} />
                  </td>
                  <td className="num">{row.updates}</td>
                  {showDaysOpen ? (
                    <td className={`num${row.daysBad ? ' strong-bad' : ''}`}>{row.daysOpen}</td>
                  ) : null}
                  {showDaysAfterClose ? (
                    <td className="num">
                      {row.daysAfterClose != null ? row.daysAfterClose : '—'}
                    </td>
                  ) : null}
                  <td>
                    <Pill tone={row.statusTone}>{row.status}</Pill>
                  </td>
                  <td className="act">
                    <div className="act-row">
                      <Link className="btn btn-sm" to={`/tickets/${row.id}`} state={linkState}>
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  )
}
