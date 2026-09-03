import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_ROWS } from '../../data/roads'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { Pill } from '../../components/ui/Pill'

const FILTER_DEFAULTS = {
  zone: 'All zones',
  status: 'All',
}

function PlusIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function RoadList() {
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState(FILTER_DEFAULTS.zone)
  const [status, setStatus] = useState(FILTER_DEFAULTS.status)

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ROAD_ROWS
    return ROAD_ROWS.filter((row) => {
      const hay = [row.code, row.name, row.stretch, row.zone, row.ward].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const actions = useMemo(
    () => (
      <Link className="btn btn-primary" to="/masters/roads/add">
        <PlusIcon />
        Add road
      </Link>
    ),
    [],
  )

  function resetFilters() {
    setZone(FILTER_DEFAULTS.zone)
    setStatus(FILTER_DEFAULTS.status)
    setQuery('')
  }

  return (
    <>
      <PageMeta
        pageId="road-list"
        title="Road master"
        crumb="5 roads · 1,000 devices mapped"
        actions={actions}
      />

      <main className="page">
        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters}>Reset</Button>
              <Button variant="dark" onClick={() => toast('Design preview — export would run here.')}>
                Export
              </Button>
            </>
          }
        >
          <Field label="Search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Road name or code"
              aria-label="Search roads"
            />
          </Field>
          <Field label="Zone">
            <select value={zone} onChange={(e) => setZone(e.target.value)}>
              <option>All zones</option>
              <option>West Zone</option>
              <option>South West Zone</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>Operational</option>
              <option>On hold</option>
            </select>
          </Field>
        </FilterBar>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Roads</h3>
              <p>Every device is mapped to one road from this list</p>
            </div>
            <div className="actions">
              <Link className="btn btn-sm" to="/devices">
                View devices
              </Link>
            </div>
          </div>

          <div className="panel-body flush">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Road name</th>
                    <th>Stretch</th>
                    <th>Zone / ward</th>
                    <th className="num">Slots</th>
                    <th className="num">Devices</th>
                    <th className="num">Down</th>
                    <th>Status</th>
                    <th className="act">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.code}>
                      <td className="code">{row.code}</td>
                      <td>
                        <Link to="/devices">{row.name}</Link>
                        <div className="muted">{row.rate}</div>
                      </td>
                      <td>
                        {row.stretch}
                        <div className="muted">{row.length}</div>
                      </td>
                      <td>
                        {row.zone}
                        <div className="muted">{row.ward}</div>
                      </td>
                      <td className="num">{row.slots}</td>
                      <td className="num">{row.devices}</td>
                      <td className="num strong-bad">{row.down}</td>
                      <td>
                        <Pill tone={row.statusTone}>{row.status}</Pill>
                      </td>
                      <td className="act">
                        <Link className="btn btn-sm" to="/masters/roads/add">
                          Edit
                        </Link>{' '}
                        <Link className="btn btn-sm" to="/devices">
                          Devices
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="foot-note">
            Slots are the surveyed capacity; devices are what is actually installed. Sobo – Marigold
            is on hold because footpath work is incomplete.{' '}
            <Link to="/masters/roads/add">Add road</Link>
          </div>
        </section>
      </main>
    </>
  )
}
