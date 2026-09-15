import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError } from '../../context/ToastContext'
import { listRoadLookups } from '../../services/roads'
import { exportWorkReport, getWorkReport } from '../../services/reports'
import { canPerm, homePathForUser, listTechnicianLookups } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Pill } from '../../components/ui/Pill'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Views } from '../../components/ui/Views'

const VIEW_OPTIONS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'range', label: 'Date range' },
]

function todayIsoDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function closeRate(closed, worked) {
  if (!worked) return 0
  return Math.round((closed / worked) * 100)
}

function resultPill(result) {
  if (result === 'Closed') return <Pill tone="ok">Closed</Pill>
  if (result === 'In progress') return <Pill tone="warn">In progress</Pill>
  if (result === 'No work logged') return <Pill tone="grey">Off</Pill>
  return <Pill tone="ok">{result}</Pill>
}

function personTableHead(view) {
  if (view === 'day') return ['Ticket', 'Slot Id', 'Road / slot', 'Issue found', 'What he did', 'Result']
  if (view === 'month') return ['Week', 'Dates', 'Volume', 'Main issues', 'Outcome', 'Result']
  return ['Day', 'Volume', 'Roads', 'Main issues', 'Outcome', 'Result']
}

export default function WorkReport() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Work report', 'v')

  const [view, setView] = useState('day')
  const [from, setFrom] = useState(() => todayIsoDate())
  const [to, setTo] = useState(() => todayIsoDate())
  const [person, setPerson] = useState('Everyone')
  const [road, setRoad] = useState('All roads')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [exporting, setExporting] = useState(false)

  const [peopleOptions, setPeopleOptions] = useState([])
  const [roadOptions, setRoadOptions] = useState([])

  const showRange = view === 'range'
  const heads = personTableHead(view)
  const people = data?.people || []

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> › Work report
      </>
    ),
    [],
  )

  useEffect(() => {
    if (!canView) return
    let cancelled = false

    async function loadLookups() {
      try {
        const [techs, roads] = await Promise.all([
          listTechnicianLookups().catch(() => []),
          listRoadLookups().catch(() => []),
        ])
        if (cancelled) return
        setPeopleOptions(techs.filter((t) => t.name))
        setRoadOptions(roads.map((r) => r.name).filter(Boolean))
      } catch {
        /* dropdowns stay empty; All roads / Everyone still work */
      }
    }

    loadLookups()
    return () => {
      cancelled = true
    }
  }, [canView])

  // from/to only affect the API when view is range (other views use backend defaults).
  const rangeFrom = view === 'range' ? from : ''
  const rangeTo = view === 'range' ? to : ''

  useEffect(() => {
    if (!canView) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const report = await getWorkReport({
          view,
          from: rangeFrom,
          to: rangeTo,
          person,
          road,
        })
        if (!cancelled) setData(report)
      } catch (err) {
        if (!cancelled) {
          setData(null)
          const msg =
            err && typeof err === 'object' && 'message' in err && err.message
              ? String(err.message)
              : 'Could not load work report.'
          setLoadError(msg)
          toastApiError(err, 'Could not load work report.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, view, person, road, rangeFrom, rangeTo])

  function resetFilters() {
    const today = todayIsoDate()
    setFrom(today)
    setTo(today)
    setPerson('Everyone')
    setRoad('All roads')
  }

  async function onExport() {
    if (exporting) return
    setExporting(true)
    try {
      await exportWorkReport({
        view,
        from: rangeFrom,
        to: rangeTo,
        person,
        road,
      })
      toast('Export downloaded.', 'success')
    } catch (err) {
      toastApiError(err, 'Could not export work report.')
    } finally {
      setExporting(false)
    }
  }

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  return (
    <>
      <PageMeta pageId="ticket-report" title="Work report" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets', label: 'All tickets' },
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/users', label: 'Users and roles' },
          ]}
        />

        <div className="page-toolbar push-end">
          <Views views={VIEW_OPTIONS} value={view} onChange={setView} />
          <div className="page-toolbar-end">
            <Button variant="dark" onClick={onExport} disabled={exporting || loading}>
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </div>

        <FilterBar actions={<Button onClick={resetFilters}>Reset</Button>}>
          <Field label="From" style={{ opacity: showRange ? 1 : 0.45 }}>
            <input
              type="date"
              value={from}
              disabled={!showRange}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To" style={{ opacity: showRange ? 1 : 0.45 }}>
            <input
              type="date"
              value={to}
              disabled={!showRange}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Field label="Person">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option>Everyone</option>
              {peopleOptions.map((p) => (
                <option key={p.id || p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {roadOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </FilterBar>

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Team at a glance</h3>
              <p>{loading ? 'Loading…' : data?.sub || '—'}</p>
            </div>
          </div>
          <div className="panel-body flush">
            {loading && !data ? <SkeletonTable rows={4} cols={8} /> : null}
            {!loading && data && !people.length ? (
              <EmptyState title="No field staff in this period">
                Try another view, date range, person, or road.
              </EmptyState>
            ) : null}
            {people.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th className="num">{data.daysLabel}</th>
                      <th className="num">Visits</th>
                      <th className="num">Tickets worked</th>
                      <th className="num">Closed</th>
                      <th className="num">Still open</th>
                      <th className="num">Close rate</th>
                      <th>Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((p) => {
                      const rate = closeRate(p.closed, p.worked)
                      return (
                        <tr key={p.name}>
                          <td>
                            <b>{p.name}</b>
                            <div className="muted">{p.roads}</div>
                          </td>
                          <td className="num">
                            {p.days} of {data.daysInPeriod}
                          </td>
                          <td className="num">{p.visits}</td>
                          <td className="num">{p.worked}</td>
                          <td className="num" style={{ color: 'var(--ok)', fontWeight: 600 }}>
                            {p.closed}
                          </td>
                          <td className="num">{p.open}</td>
                          <td className="num">{rate}%</td>
                          <td>
                            <div className={`util${p.load < 60 ? ' low' : ''}`}>
                              <i style={{ width: `${p.load}%` }} />
                            </div>
                            <div className="muted">{p.load}% of capacity</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
          {data?.note ? <div className="foot-note">{data.note}</div> : null}
        </section>

        {people.map((p) => {
              const rate = closeRate(p.closed, p.worked)
              const tickets = Array.isArray(p.tickets) ? p.tickets : []
              return (
                <section className="panel" key={p.name}>
                  <div className="person">
                    <div className="who2">
                      <b>
                        <Link to="/users" style={{ color: 'inherit' }}>
                          {p.name}
                        </Link>
                      </b>
                      <small>
                        {p.role} · {p.roads}
                      </small>
                    </div>
                    <div className="nums">
                      <div>
                        <b>{p.days}</b>
                        <small>days worked</small>
                      </div>
                      <div>
                        <b>{p.visits}</b>
                        <small>visits</small>
                      </div>
                      <div>
                        <b>{p.worked}</b>
                        <small>tickets worked</small>
                      </div>
                      <div className="ok">
                        <b>{p.closed}</b>
                        <small>closed</small>
                      </div>
                      <div className="warn">
                        <b>{p.open}</b>
                        <small>still open</small>
                      </div>
                      <div>
                        <b>{rate}%</b>
                        <small>close rate</small>
                      </div>
                    </div>
                  </div>
                  <div className="panel-body flush">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {heads.map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((t) => {
                            const row = Array.isArray(t) ? t : []
                            const first = /^TK-/.test(row[0] || '') ? (
                              <Link className="code" to={`/tickets/${row[0]}`}>
                                {row[0]}
                              </Link>
                            ) : (
                              <b>{row[0]}</b>
                            )
                            return (
                              <tr key={row.join('|')}>
                                <td>{first}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                                <td>{row[3]}</td>
                                <td>{row[4]}</td>
                                <td>{resultPill(row[5])}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="foot-note">
                    {p.closed} of {p.worked} tickets closed.
                    {p.cost ? ` Cost booked in this period: ${p.cost}.` : null}
                  </div>
                </section>
              )
            })}
      </main>
    </>
  )
}
