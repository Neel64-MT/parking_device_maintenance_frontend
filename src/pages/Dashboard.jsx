import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Panel } from '../components/ui/Panel'
import { Tooltip } from '../components/ui/Tooltip'
import {
  DASHBOARD_ROADS,
  DOWN_REASONS,
  FLEET,
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

  return (
    <>
      <PageMeta
        pageId="dashboard"
        title="Dashboard"
        crumb="Fleet status as on 01 Sep 2026, 10:42 AM"
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

        <div className="page-toolbar">
          <DashboardFilters
            road={road}
            from={from}
            to={to}
            onRoad={setRoad}
            onFrom={setFrom}
            onTo={setTo}
          />
        </div>

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
            {FLEET.legend.map((item) => {
              const link = (
                <Link to={item.to}>
                  <b>{item.value}</b>
                  <small>{item.label}</small>
                </Link>
              )
              return (
                <div key={item.label}>
                  {item.dot ? <i className={`dot ${item.dot}`} /> : null}
                  {item.tip ? <Tooltip content={item.tip}>{link}</Tooltip> : link}
                </div>
              )
            })}
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
      </main>
    </>
  )
}
