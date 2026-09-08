import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ROAD_OPTIONS } from '../../data/slots'
import { ApiRequestError } from '../../services/api'
import { listDevices } from '../../services/devices'
import { canPerm } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { SkeletonTable, SkeletonTiles } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'
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

/** Format API date (ISO / YYYY-MM-DD) for the Installed column. */
function formatInstalled(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function tileHref(label) {
  if (label === 'Working') return '/devices'
  if (label === 'Under repair' || label === 'Not working') return '/tickets'
  return null
}

export default function DeviceList() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Device list', 'v')
  const canAdd = canPerm(user, 'Add device', 'c')
  const canScan = canPerm(user, 'Scan QR', 'v')

  const [query, setQuery] = useState('')
  const [road, setRoad] = useState(FILTER_DEFAULTS.road)
  const [status, setStatus] = useState(FILTER_DEFAULTS.status)
  const [repeats, setRepeats] = useState(FILTER_DEFAULTS.repeats)
  const [applied, setApplied] = useState({
    q: '',
    road: FILTER_DEFAULTS.road,
    status: FILTER_DEFAULTS.status,
    repeats: FILTER_DEFAULTS.repeats,
  })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })

  const [rows, setRows] = useState([])
  const [tiles, setTiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view devices.')
          setRows([])
          setTiles([])
          setPagination({ page: 1, limit, total: 0, totalPages: 1 })
        }
        return
      }
      if (!cancelled) {
        setLoadError('')
        setLoading(true)
      }
      try {
        const result = await listDevices({
          q: applied.q,
          road: applied.road,
          status: applied.status,
          repeats: applied.repeats,
          page,
          limit,
        })
        if (cancelled) return
        setRows(result.rows)
        setTiles(result.tiles)
        setPagination(result.pagination)
      } catch (err) {
        if (!cancelled) {
          setRows([])
          setTiles([])
          setPagination({ page: 1, limit, total: 0, totalPages: 1 })
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load devices.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [canView, applied, page, limit])

  const crumb = useMemo(() => {
    const total = pagination.total || 0
    const totalLabel = total.toLocaleString('en-IN')
    if (!total) return 'Devices'
    return `${totalLabel} device${total === 1 ? '' : 's'}`
  }, [pagination.total])

  function applyFilters() {
    setPage(1)
    setApplied({
      q: query.trim(),
      road,
      status,
      repeats,
    })
  }

  function resetFilters() {
    setRoad(FILTER_DEFAULTS.road)
    setStatus(FILTER_DEFAULTS.status)
    setRepeats(FILTER_DEFAULTS.repeats)
    setQuery('')
    setPage(1)
    setApplied({
      q: '',
      road: FILTER_DEFAULTS.road,
      status: FILTER_DEFAULTS.status,
      repeats: FILTER_DEFAULTS.repeats,
    })
  }

  function handleLimitChange(next) {
    setLimit(next)
    setPage(1)
  }

  const showingFrom = pagination.total
    ? (pagination.page - 1) * pagination.limit + 1
    : 0
  const showingTo = Math.min(pagination.page * pagination.limit, pagination.total || 0)
  const panelSubtitle = loading
    ? 'Loading…'
    : pagination.total
      ? `Showing ${showingFrom}–${showingTo} of ${pagination.total.toLocaleString('en-IN')}`
      : 'No devices match these filters'

  return (
    <>
      <PageMeta pageId="device-list" title="Device list" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            ...(canAdd ? [{ to: '/devices/add', label: 'Add device' }] : []),
            ...(canScan ? [{ to: '/devices/scan', label: 'Scan QR' }] : []),
            { to: '/masters/roads', label: 'Road' },
            { to: '/tickets', label: 'All tickets' },
          ]}
          actions={
            canAdd ? (
              <Link className="btn btn-primary" to="/devices/add">
                <PlusIcon />
                Add device
              </Link>
            ) : null
          }
        />

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? (
          <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading devices</span>
            <SkeletonTiles count={4} />
          </div>
        ) : (
          <div className="tiles">
            {tiles.map((t) => {
              const href = tileHref(t.label)
              return href ? (
                <Link key={t.label} className="tile-link" to={href}>
                  <Tile value={t.value} label={t.label} tone={t.tone} />
                </Link>
              ) : (
                <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
              )
            })}
          </div>
        )}

        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
              <Button variant="dark" onClick={applyFilters} disabled={loading}>
                Apply
              </Button>
              <Button
                variant="dark"
                onClick={() => toast('Design preview — export would run here.')}
                disabled={loading}
              >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyFilters()
                }
              }}
              placeholder="Device ID, QR code or slot"
              aria-label="Search devices"
              disabled={loading && !rows.length}
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
          subtitle={panelSubtitle}
          link="Road"
          linkTo="/masters/roads"
          flush
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
                {loading ? <SkeletonTable rows={6} cols={8} /> : null}
                {!loading && !rows.length ? (
                  <tr>
                    <td colSpan={8}>
                      <span className="muted">No devices found.</span>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? rows.map((row) => (
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
                        <td>{formatInstalled(row.installed)}</td>
                        <td>
                          <Pill tone={row.statusTone}>{row.status}</Pill>
                        </td>
                        <td>
                          {row.issue ? (
                            <>
                              {row.issue}
                              <div className="muted">
                                {row.ticketId ? (
                                  <Link to={`/tickets/${row.ticketId}`}>{row.ticketId}</Link>
                                ) : null}
                                {row.ticketId && row.ticketNote ? ' · ' : null}
                                {row.ticketNote || null}
                              </div>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className={`num${row.ticketsBad ? ' strong-bad' : ''}`}>
                          {row.tickets6m}
                        </td>
                        <td className="act">
                          <Link className="btn btn-sm" to={`/devices/${row.id}`}>
                            History
                          </Link>{' '}
                          <Link
                            className="btn btn-sm"
                            to={row.ticketId ? `/tickets/${row.ticketId}` : '/tickets/raise'}
                          >
                            Ticket
                          </Link>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={pagination.page || page}
            limit={limit}
            total={pagination.total || 0}
            totalPages={pagination.totalPages || 1}
            disabled={loading}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        </Panel>
      </main>
    </>
  )
}
