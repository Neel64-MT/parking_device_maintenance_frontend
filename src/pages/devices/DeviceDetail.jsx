import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import {
  DEVICE_FAIL_RANKS,
  DEVICE_HEADER,
  DEVICE_LIFE_TILES,
  DEVICE_PART_HISTORY,
  DEVICE_PART_SUMMARY,
  DEVICE_TICKET_ROWS,
} from '../../data/deviceDetail'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { Tile } from '../../components/ui/Tile'

export default function DeviceDetail() {
  const crumb = useMemo(
    () => (
      <>
        <Link to="/devices">Devices</Link> › {DEVICE_HEADER.id} ›{' '}
        <Link to="/masters/roads">{DEVICE_HEADER.road}</Link>, Slot {DEVICE_HEADER.slot}
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <>
        <Link className="btn" to="/devices">
          Back to list
        </Link>
        <Link className="btn btn-primary" to="/tickets/raise">
          Raise ticket
        </Link>
      </>
    ),
    [],
  )

  return (
    <>
      <PageMeta pageId="device-detail" title="Device history" crumb={crumb} actions={actions} />

      <main className="page">
        <section className="record">
          <div className="record-top">
            <div>
              <h3>{DEVICE_HEADER.id}</h3>
              <div className="sub">
                <b>{DEVICE_HEADER.road}</b> · Slot <b>{DEVICE_HEADER.slot}</b> · {DEVICE_HEADER.qr}
              </div>
            </div>
            <div style={{ marginLeft: 20 }}>
              <Pill tone={DEVICE_HEADER.statusTone}>{DEVICE_HEADER.status}</Pill>
            </div>
            <div className="push">
              <Button onClick={() => toast('QR label sent to printer.')}>Print QR label</Button>
              <Link className="btn" to="/devices/add">
                Edit device
              </Link>
            </div>
          </div>

          <div className="facts">
            {DEVICE_HEADER.facts.map((f) => (
              <div key={f.label}>
                <small>{f.label}</small>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="tiles five">
          {DEVICE_LIFE_TILES.map((t) => (
            <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
          ))}
        </div>

        <Panel
          title="Ticket and resolution"
          subtitle="What was reported on the left, what was actually done on the right"
          link="All tickets"
          linkTo="/tickets"
          flush
          foot={
            <>
              Issue reported and issue found are separate on purpose — what the attendant says is rarely
              what the technician finds, and only the second column is worth analysing.
            </>
          }
        >
          <div className="table-wrap">
            <table className="split">
              <thead>
                <tr>
                  <th colSpan={4} className="grp">
                    Ticket raised
                  </th>
                  <th colSpan={4} className="grp grp-alt">
                    Resolution
                  </th>
                </tr>
                <tr>
                  <th>Ticket</th>
                  <th>Raised on</th>
                  <th>Issue reported</th>
                  <th>Issue found</th>
                  <th className="sep">Action taken</th>
                  <th>Parts replaced</th>
                  <th className="num">Days open</th>
                  <th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {DEVICE_TICKET_ROWS.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="code" to={`/tickets/${row.id}`}>
                        {row.id}
                      </Link>
                    </td>
                    <td>
                      {row.raisedDate}
                      <div className="muted">{row.raisedTime}</div>
                    </td>
                    <td>
                      {row.reported}
                      <div className="muted">{row.reportedBy}</div>
                    </td>
                    <td>
                      {row.found}
                      <div className="muted">{row.foundCat}</div>
                    </td>
                    <td className="sep">
                      {row.actionMuted ? <span className="muted">{row.action}</span> : row.action}
                    </td>
                    <td>
                      {row.partsMuted ? <span className="muted">{row.partsMuted}</span> : row.parts}
                    </td>
                    <td className={`num${row.daysOpenBad ? ' strong-bad' : ''}`}>
                      {row.daysOpen}
                      {row.daysNote ? <div className="muted">{row.daysNote}</div> : null}
                    </td>
                    <td className="num">
                      {row.cost ? row.cost : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6}>
                    <b>6 tickets since installation</b>
                  </td>
                  <td className="num">
                    <b>19.5</b>
                  </td>
                  <td className="num">
                    <b>₹ 14,850</b>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <div className="grid-2">
          <Panel
            title="Part replacement history"
            subtitle="Every part changed on this device, newest first"
            flush
            foot="Two power supplies in four months on the same slot. Check the pit for water before fitting a third."
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Part replaced</th>
                    <th>Why</th>
                    <th>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVICE_PART_HISTORY.map((row, i) => (
                    <tr key={`${row.ticketId}-${row.part}-${i}`}>
                      <td>{row.date}</td>
                      <td>
                        {row.part}
                        <div className="muted">{row.note}</div>
                      </td>
                      <td>{row.why}</td>
                      <td>
                        <Link className="code" to={`/tickets/${row.ticketId}`}>
                          {row.ticketId}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div>
            <Panel
              title="Parts replaced so far"
              subtitle="How many times each part has been changed"
              flush
              foot="Motor replacement on TK-1042 is pending, so this will read 1 once that ticket closes."
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th className="num">Times replaced</th>
                      <th>Last replaced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEVICE_PART_SUMMARY.map((row) => (
                      <tr key={row.part}>
                        <td>{row.part}</td>
                        <td className={`num${row.timesBad ? ' strong-bad' : ''}`}>{row.times}</td>
                        <td>{row.last ? row.last : <span className="muted">Original</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel
              title="What keeps failing here"
              subtitle="By category, over 6 tickets"
              bodyStyle={{ paddingTop: 6 }}
              foot={
                <>
                  Water in the pit has now caused a board failure and two power supply failures. It is a
                  civil problem showing up as an electrical one.
                </>
              }
            >
              {DEVICE_FAIL_RANKS.map((row) => (
                <Link key={row.name} className="rank-row" to="/tickets">
                  <div className="name">{row.name}</div>
                  <div className="track">
                    <i className={row.hot ? 'hot' : undefined} style={{ width: row.width }} />
                  </div>
                  <div className="n">{row.n}</div>
                </Link>
              ))}
            </Panel>
          </div>
        </div>
      </main>
    </>
  )
}
