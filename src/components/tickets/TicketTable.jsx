import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Pill } from '../ui/Pill'
import { SkeletonTable } from '../ui/Skeleton'
import { DateTimeCell, WhatsappTimeCell } from './WhatsappTimeCell'

/**
 * Ticket rows from GET /api/tickets (All tickets, Slot View). Markup matches the
 * original All tickets table; links open the existing Ticket Detail route.
 * `showSlot` = Slot Label + Road columns (hidden where the page is already one slot). The Slot
 * Label links to the device by `deviceId`; a device without a label shows its `deviceId`.
 * `person` = which person column to show: raisedBy, assignedTo (Under repair) or closedBy (Closed).
 * `time` = reported (WhatsApp / created time), lastUpdate (`lastUpdateAt`, Under repair tab;
 * falls back to the reported time when the ticket has no update) or closed (`closedAt`, Closed tab).
 */
const PERSON_COLUMNS = {
  raisedBy: 'Raised by',
  assignedTo: 'Assigned to',
  closedBy: 'Closed by',
}

/** Bin icon for the row delete action (same glyph as Issue / Part master). */
function TrashIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function TicketTable({
  rows,
  loading,
  showDaysOpen = false,
  showDaysAfterClose = false,
  showSlot = true,
  person = 'raisedBy',
  time = 'reported',
  linkState,
  emptyText = 'No tickets match this view.',
  canDelete = false,
  onDelete,
  deletingId = null,
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
            {showSlot ? <th>Slot Label</th> : null}
            {showSlot ? <th>Road</th> : null}
            <th>Issue reported</th>
            <th>Issue found</th>
            <th>{PERSON_COLUMNS[personKey]}</th>
            <th>{time === 'closed' ? 'Closed time' : time === 'lastUpdate' ? 'Last update time' : 'Reported time'}</th>
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
                        {row.slotLabel || row.deviceId}
                      </Link>
                    </td>
                  ) : null}
                  {showSlot ? <td>{row.road}</td> : null}
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
                    {time === 'closed' ? (
                      <DateTimeCell value={row.closedAt} />
                    ) : time === 'lastUpdate' && row.lastUpdateAt ? (
                      <DateTimeCell value={row.lastUpdateAt} />
                    ) : (
                      <WhatsappTimeCell row={row} />
                    )}
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
                      {canDelete && onDelete ? (
                        <Button
                          variant="danger"
                          size="sm"
                          className="btn-icon"
                          onClick={() => onDelete(row)}
                          disabled={deletingId === row.id}
                          aria-busy={deletingId === row.id}
                          title="Delete ticket"
                          aria-label={`Delete ticket ${row.id}`}
                        >
                          <TrashIcon />
                        </Button>
                      ) : null}
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
