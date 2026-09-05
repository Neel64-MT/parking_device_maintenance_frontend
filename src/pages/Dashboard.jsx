import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { useAuth } from '../context/AuthContext'
import { ApiRequestError } from '../services/api'
import { getDashboard } from '../services/dashboard'
import { canPerm } from '../services/users'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Panel } from '../components/ui/Panel'
import { Tooltip } from '../components/ui/Tooltip'
import { DASHBOARD_ROADS } from '../data/dashboard'

const LEGEND_DOT = {
  Working: 'seg-ok',
  'Under repair': 'seg-warn',
  'Not working': 'seg-bad',
}

const LEGEND_TIP = {
  'Under repair': 'Technician assigned',
  'Not working': 'Ticket open, not yet attended',
}

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
  const { user } = useAuth()
  const canView = canPerm(user, 'Dashboard', 'v')

  const [road, setRoad] = useState('All roads')
  const [from, setFrom] = useState('2026-08-01')
  const [to, setTo] = useState('2026-09-01')

  const [crumb, setCrumb] = useState('Fleet status')
  const [fleet, setFleet] = useState(null)
  const [downReasons, setDownReasons] = useState([])
  const [roadStatus, setRoadStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view the dashboard.')
        }
        return
      }
      if (!cancelled) {
        setLoadError('')
        setLoading(true)
      }
      try {
        const data = await getDashboard({ road, from, to })
        if (cancelled) return
        setCrumb(data.crumb || 'Fleet status')
        setFleet(data.fleet || null)
        setDownReasons(data.downReasons || [])
        setRoadStatus(data.roadStatus || [])
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load dashboard.')
          setFleet(null)
          setDownReasons([])
          setRoadStatus([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, road, from, to])

  const legend = (fleet?.legend || []).map((item) => ({
    ...item,
    dot: LEGEND_DOT[item.label],
    tip: LEGEND_TIP[item.label],
  }))

  const bar = fleet?.bar || []
  const ariaLabel = legend.map((i) => `${i.value} ${i.label}`).join(', ')
  const downTotal = downReasons.reduce((s, r) => s + (r.n || 0), 0)

  return (
    <>
      <PageMeta pageId="dashboard" title="Dashboard" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets', label: 'All tickets' },
            { to: '/tickets/raise', label: 'Raise a ticket' },
            { to: '/tickets/update', label: 'Update a ticket' },
            { to: '/devices', label: 'Devices' },
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

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading && !fleet ? (
          <p className="muted">Loading dashboard…</p>
        ) : null}

        {fleet ? (
          <section className="fleet">
            <div className="fleet-head">
              <div className="total">{fleet.total}</div>
              <div className="cap">{fleet.caption}</div>
              <div className="stamp">{fleet.stamp}</div>
            </div>

            <div className="bar" role="img" aria-label={ariaLabel || 'Fleet status'}>
              {bar.map((seg) => (
                <span
                  key={seg.className}
                  className={seg.className}
                  style={{ width: seg.width }}
                />
              ))}
            </div>

            <div className="legend">
              {legend.map((item) => {
                const link = (
                  <Link to={item.to || '/tickets'}>
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
        ) : null}

        <div className="grid-2">
          <Panel
            title="Why devices are down"
            subtitle={
              downTotal
                ? `${downTotal} open tickets · grouped by issue found on site`
                : 'Open tickets · grouped by issue found on site'
            }
            link="View tickets"
            linkTo="/tickets"
            bodyStyle={{ paddingTop: 6 }}
            foot={
              <>
                Counts follow tickets you are allowed to see.
                <Link to="/tickets">Full breakdown</Link>
              </>
            }
          >
            {!loading && !downReasons.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No open-ticket reasons in this scope.
              </p>
            ) : null}
            {downReasons.map((row) => (
              <Link key={`${row.name}-${row.category}`} className="rank-row" to="/tickets">
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
            foot="Working / repair / down derived from open tickets in your access scope."
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
                  {!loading && !roadStatus.length ? (
                    <tr>
                      <td colSpan={5}>
                        <span className="muted">No road data.</span>
                      </td>
                    </tr>
                  ) : null}
                  {roadStatus.map((r) => (
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
