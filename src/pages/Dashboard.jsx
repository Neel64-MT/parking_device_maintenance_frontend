import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Panel } from '../components/ui/Panel'
import { Pill } from '../components/ui/Pill'
import {
  DASHBOARD_ROADS,
  DOWN_REASONS,
  FLEET,
  OPEN_TICKETS,
  ROAD_STATUS,
} from '../data/dashboard'

function DashboardFilters({ road, from, to, onRoad, onFrom, onTo }) {
  return (
    <>
      <select aria-label="Filter by road" value={road} onChange={(e) => onRoad(e.target.value)}>
        {DASHBOARD_ROADS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        aria-label="From date"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        aria-label="To date"
      />
    </>
  )
}

export default function Dashboard() {
  const [road, setRoad] = useState('All roads')
  const [from, setFrom] = useState('2026-08-01')
  const [to, setTo] = useState('2026-09-01')

  const actions = useMemo(
    () => (
      <DashboardFilters
        road={road}
        from={from}
        to={to}
        onRoad={setRoad}
        onFrom={setFrom}
        onTo={setTo}
      />
    ),
    [road, from, to],
  )

  return (
    <>
      <PageMeta
        pageId="dashboard"
        title="Dashboard"
        crumb="Fleet status as on 01 Sep 2026, 10:42 AM"
        actions={actions}
      />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets', label: 'All tickets' },
            { to: '/tickets/report', label: 'Work report' },
            { to: '/devices', label: 'Devices' },
            { to: '/tickets/raise', label: 'Raise a ticket' },
          ]}
        />

        <section className="fleet">
          <div className="fleet-head">
            <div className="total">{FLEET.total}</div>
            <div className="cap">{FLEET.caption}</div>
            <div className="stamp">{FLEET.stamp}</div>
          </div>

          <div className="bar" role="img" aria-label={FLEET.ariaLabel}>
            {FLEET.bar.map((seg) => (
              <span
                key={seg.className}
                className={seg.className}
                style={{ width: seg.width }}
              />
            ))}
          </div>

          <div className="legend">
            {FLEET.legend.map((item) => (
              <div key={item.label} className={item.push ? 'legend-push' : undefined}>
                {item.dot ? <i className={`dot ${item.dot}`} /> : null}
                <Link to={item.to}>
                  <b>{item.value}</b>
                  <small>
                    {item.label}
                    {item.em ? <em> {item.em}</em> : null}
                  </small>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <div className="grid-2">
          <Panel
            title="Why devices are down"
            subtitle="83 devices · grouped by issue found on site"
            link="View tickets"
            linkTo="/tickets"
            bodyStyle={{ paddingTop: 6 }}
            foot={
              <>
                External damage and mechanical failure together account for 35% of all downtime
                this month.
                <Link to="/tickets">Full breakdown</Link>
              </>
            }
          >
            {DOWN_REASONS.map((row) => (
              <Link key={row.name} className="rank-row" to="/tickets">
                <div className="name">
                  {row.name}
                  <em>{row.category}</em>
                </div>
                <div className="track">
                  <i className={row.hot ? 'hot' : undefined} style={{ width: row.width }} />
                </div>
                <div className="n">{row.n}</div>
              </Link>
            ))}
          </Panel>

          <Panel
            title="Road-wise status"
            subtitle="Devices by installation location"
            link="Road master"
            linkTo="/masters/roads"
            flush
            foot="Science City carries 60% of the fleet and 55% of open faults."
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Road</th>
                    <th className="num">Total</th>
                    <th className="num">Working</th>
                    <th className="num">Repair</th>
                    <th className="num">Down</th>
                  </tr>
                </thead>
                <tbody>
                  {ROAD_STATUS.map((r) => (
                    <tr key={r.name}>
                      <td>
                        <Link to="/devices">{r.name}</Link>
                        <div className="muted">{r.stretch}</div>
                      </td>
                      <td className="num">{r.total}</td>
                      <td className="num">{r.working}</td>
                      <td className="num">{r.repair}</td>
                      <td className="num strong-bad">{r.down}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel
          title="Open tickets"
          subtitle="83 open · showing 8 oldest first"
          link="See all 83"
          linkTo="/tickets"
          flush
          foot={
            <>
              Tickets open more than 3 days are shown in red. 11 tickets currently breach that
              mark.
              <Link to="/tickets/raise">Raise a ticket</Link>
            </>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Device</th>
                  <th>Road / slot</th>
                  <th>Reported issue</th>
                  <th>Reported by</th>
                  <th>Raised on</th>
                  <th className="num">Days open</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {OPEN_TICKETS.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link className="code" to={`/tickets/${t.id}`}>
                        {t.id}
                      </Link>
                    </td>
                    <td>
                      <Link className="code" to={`/devices/${t.deviceId}`}>
                        {t.deviceId}
                      </Link>
                    </td>
                    <td>
                      {t.road}
                      <div className="muted">{t.slot}</div>
                    </td>
                    <td>
                      {t.issue}
                      <div className="muted">{t.issueDetail}</div>
                    </td>
                    <td>{t.reportedBy}</td>
                    <td>
                      {t.raisedOn}
                      <div className="muted">{t.raisedTime}</div>
                    </td>
                    <td className={`num${t.daysBad ? ' strong-bad' : ''}`}>{t.daysOpen}</td>
                    <td>
                      <Pill tone={t.statusTone}>{t.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </>
  )
}
