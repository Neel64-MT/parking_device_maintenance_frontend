import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS } from '../../data/slots'
import { REPORT } from '../../data/workReport'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Pill } from '../../components/ui/Pill'
import { Views } from '../../components/ui/Views'

const VIEW_OPTIONS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'range', label: 'Date range' },
]

function resultPill(result) {
  if (result === 'Closed') return <Pill tone="ok">Closed</Pill>
  if (result === 'In progress') return <Pill tone="warn">In progress</Pill>
  if (result === 'No work logged') return <Pill tone="grey">Off</Pill>
  return <Pill tone="ok">{result}</Pill>
}

function personTableHead(view) {
  if (view === 'day') return ['Ticket', 'Device', 'Road / slot', 'Issue found', 'What he did', 'Result']
  if (view === 'month') return ['Week', 'Dates', 'Volume', 'Main issues', 'Outcome', 'Result']
  return ['Day', 'Volume', 'Roads', 'Main issues', 'Outcome', 'Result']
}

export default function WorkReport() {
  const [view, setView] = useState('day')
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-09-01')
  const [person, setPerson] = useState('Everyone')
  const [road, setRoad] = useState('All roads')

  const data = REPORT[view]
  const showRange = view === 'range'
  const heads = personTableHead(view)

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> › Work report
      </>
    ),
    [],
  )

  function resetFilters() {
    setFrom('2026-09-01')
    setTo('2026-09-01')
    setPerson('Everyone')
    setRoad('All roads')
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
            <Button variant="dark" onClick={() => toast('Design preview — export would run here.')}>
              Export
            </Button>
          </div>
        </div>

        <FilterBar
          actions={<Button onClick={resetFilters}>Reset</Button>}
        >
          <Field label="From" style={{ opacity: showRange ? 1 : 0.45 }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To" style={{ opacity: showRange ? 1 : 0.45 }}>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Person">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option>Everyone</option>
              <option>Ramesh Vaghela</option>
              <option>Jignesh Solanki</option>
              <option>Mahesh Thakor</option>
            </select>
          </Field>
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {ROAD_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </FilterBar>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Team at a glance</h3>
              <p>{data.sub}</p>
            </div>
          </div>
          <div className="panel-body flush">
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
                  {data.people.map((p) => {
                    const rate = Math.round((p.closed / p.worked) * 100)
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
          </div>
          <div className="foot-note">{data.note}</div>
        </section>

        {data.people.map((p) => {
          const rate = Math.round((p.closed / p.worked) * 100)
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
                      {p.tickets.map((t) => {
                        const first = /^TK-/.test(t[0]) ? (
                          <Link className="code" to={`/tickets/${t[0]}`}>
                            {t[0]}
                          </Link>
                        ) : (
                          <b>{t[0]}</b>
                        )
                        return (
                          <tr key={t.join('|')}>
                            <td>{first}</td>
                            <td>{t[1]}</td>
                            <td>{t[2]}</td>
                            <td>{t[3]}</td>
                            <td>{t[4]}</td>
                            <td>{resultPill(t[5])}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="foot-note">
                {p.closed} of {p.worked} tickets closed. Cost booked in this period: {p.cost}.
              </div>
            </section>
          )
        })}
      </main>
    </>
  )
}
