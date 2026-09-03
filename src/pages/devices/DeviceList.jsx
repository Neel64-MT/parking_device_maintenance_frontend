import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { DEVICE_LIST_TILES, DEVICE_ROWS } from '../../data/devices'
import { ROAD_OPTIONS } from '../../data/slots'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { Tile } from '../../components/ui/Tile'

const FILTER_DEFAULTS = {
  road: 'All roads',
  status: 'All',
  repeats: 'All devices',
}

function PlusIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function DeviceList() {
  const [query, setQuery] = useState('')
  const [road, setRoad] = useState(FILTER_DEFAULTS.road)
  const [status, setStatus] = useState(FILTER_DEFAULTS.status)
  const [repeats, setRepeats] = useState(FILTER_DEFAULTS.repeats)

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DEVICE_ROWS
    return DEVICE_ROWS.filter((row) => {
      const hay = [row.id, row.qr, row.road, row.slot, row.issue, row.ticketId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const actions = useMemo(
    () => (
      <>
        <Link className="btn" to="/devices/scan">
          Scan QR
        </Link>
        <Link className="btn btn-primary" to="/devices/add">
          <PlusIcon />
          Add device
        </Link>
      </>
    ),
    [],
  )

  function resetFilters() {
    setRoad(FILTER_DEFAULTS.road)
    setStatus(FILTER_DEFAULTS.status)
    setRepeats(FILTER_DEFAULTS.repeats)
    setQuery('')
  }

  return (
    <>
      <PageMeta
        pageId="device-list"
        title="Device list"
        crumb="1,000 devices across 5 roads"
        actions={actions}
      />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/devices/add', label: 'Add device' },
            { to: '/devices/scan', label: 'Scan QR' },
            { to: '/masters/roads', label: 'Road master' },
            { to: '/tickets', label: 'All tickets' },
          ]}
        />

        <div className="tiles">
          {DEVICE_LIST_TILES.map((t) =>
            t.to ? (
              <Link key={t.label} className="tile-link" to={t.to}>
                <Tile value={t.value} label={t.label} tone={t.tone} />
              </Link>
            ) : (
              <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
            ),
          )}
        </div>

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
              placeholder="Device ID, QR code or slot"
              aria-label="Search devices"
            />
          </Field>
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {ROAD_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>Working</option>
              <option>Under repair</option>
              <option>Not working</option>
            </select>
          </Field>
          <Field label="Repeat faults">
            <select value={repeats} onChange={(e) => setRepeats(e.target.value)}>
              <option>All devices</option>
              <option>3 or more in 6 months</option>
              <option>5 or more in 6 months</option>
            </select>
          </Field>
        </FilterBar>

        <Panel
          title="Devices"
          subtitle={`Showing ${filteredRows.length} of 1,000`}
          link="Road master"
          linkTo="/masters/roads"
          flush
          foot={
            <>
              Devices with 3 or more tickets in 6 months are shown in red — these are the ones to
              consider replacing rather than repairing again.{' '}
              <Link to="/devices/add">Add device</Link>
            </>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>QR code</th>
                  <th>Road / slot</th>
                  <th>Installed</th>
                  <th>Status</th>
                  <th>Current issue</th>
                  <th className="num">
                    Tickets
                    <br />
                    <span className="muted">6 months</span>
                  </th>
                  <th className="act">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="code" to={`/devices/${row.id}`}>
                        {row.id}
                      </Link>
                    </td>
                    <td>{row.qr}</td>
                    <td>
                      {row.road}
                      <div className="muted">{row.slot}</div>
                    </td>
                    <td>{row.installed}</td>
                    <td>
                      <Pill tone={row.statusTone}>{row.status}</Pill>
                    </td>
                    <td>
                      {row.issue ? (
                        <>
                          {row.issue}
                          <div className="muted">
                            <Link to={`/tickets/${row.ticketId}`}>{row.ticketId}</Link>
                            {' · '}
                            {row.ticketNote}
                          </div>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className={`num${row.ticketsBad ? ' strong-bad' : ''}`}>{row.tickets6m}</td>
                    <td className="act">
                      <Link className="btn btn-sm" to={`/devices/${row.id}`}>
                        History
                      </Link>{' '}
                      <Link className="btn btn-sm" to="/tickets/raise">
                        Ticket
                      </Link>
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
