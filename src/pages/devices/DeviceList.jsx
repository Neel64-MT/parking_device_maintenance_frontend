import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ApiRequestError } from '../../services/api'
import {
  getDeviceSync,
  getLatestDeviceSync,
  listDevices,
  startDeviceSync,
} from '../../services/devices'
import { listRoadLookups } from '../../services/roads'
import { canPerm } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { SkeletonTable, SkeletonTiles } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'
import { Tile } from '../../components/ui/Tile'

const FILTER_DEFAULTS = {
  road: 'All roads',
  status: 'All',
  repeats: 'All devices',
}

const SYNC_POLL_MS = 2000

function PlusIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 0 0-15.5-6.4" />
      <path d="M3 4v5h5" />
      <path d="M3 12a9 9 0 0 0 15.5 6.4" />
      <path d="M21 20v-5h-5" />
    </svg>
  )
}

function displayOrDash(value) {
  if (value == null || value === '') return '—'
  return String(value)
}

function tileHref(label) {
  if (label === 'Working') return '/devices'
  if (label === 'Under repair' || label === 'Not working') return '/tickets'
  return null
}

export default function DeviceList() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Device list', 'v')
  const canSync = canPerm(user, 'Device list', 'c')
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
  const [roadOptions, setRoadOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const [syncing, setSyncing] = useState(false)
  const [syncRunId, setSyncRunId] = useState(null)
  const syncHandledRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view devices.')
          setRows([])
          setTiles([])
          setRoadOptions([])
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

      try {
        const roads = await listRoadLookups()
        if (!cancelled) {
          setRoadOptions(roads.map((r) => r.name).filter(Boolean))
        }
      } catch {
        /* keep prior road options — device list still usable */
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [canView, applied, page, limit, reloadToken])

  const finishSync = useCallback((run) => {
    if (!run?.id || syncHandledRef.current === run.id) return
    syncHandledRef.current = run.id
    setSyncing(false)
    setSyncRunId(null)
    if (run.status === 'completed') {
      toast('Device sync completed.', 'success')
      setReloadToken((n) => n + 1)
    } else if (run.status === 'failed') {
      toast(run.errorMessage || 'Device sync failed.', 'error')
    }
  }, [])

  // Resume in-progress sync on mount when the user can start sync.
  useEffect(() => {
    if (!canSync) return
    let cancelled = false

    async function checkLatest() {
      try {
        const latest = await getLatestDeviceSync()
        if (cancelled || !latest) return
        if (latest.status === 'started') {
          setSyncing(true)
          setSyncRunId(latest.id)
        }
      } catch {
        /* ignore — list still works */
      }
    }

    checkLatest()
    return () => {
      cancelled = true
    }
  }, [canSync])

  // Poll while a sync run is in progress.
  useEffect(() => {
    if (!syncing || !syncRunId) return
    let cancelled = false

    async function poll() {
      try {
        const run = await getDeviceSync(syncRunId)
        if (cancelled) return
        if (run.status === 'started') return
        finishSync(run)
      } catch (err) {
        if (cancelled) return
        setSyncing(false)
        setSyncRunId(null)
        toast(
          err instanceof ApiRequestError ? err.message : 'Could not check sync status.',
          'error',
        )
      }
    }

    poll()
    const timer = setInterval(poll, SYNC_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [syncing, syncRunId, finishSync])

  async function handleSync() {
    if (syncing) return
    setSyncing(true)
    syncHandledRef.current = null
    try {
      const { run, message } = await startDeviceSync()
      toast(message || 'Device sync started successfully.', 'success')
      if (run?.status === 'started' && run.id) {
        setSyncRunId(run.id)
        return
      }
      if (run?.status === 'completed' || run?.status === 'failed') {
        finishSync(run)
        return
      }
      setSyncing(false)
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'SYNC_IN_PROGRESS') {
        const runId = err.details?.runId
        toast(err.message, 'warning')
        if (runId) {
          setSyncRunId(runId)
          return
        }
        setSyncing(false)
        return
      }
      setSyncing(false)
      toast(
        err instanceof ApiRequestError ? err.message : 'Could not start device sync.',
        'error',
      )
    }
  }

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

  const jumpActions =
    canSync || canAdd ? (
      <>
        {canSync ? (
          <Button variant="dark" onClick={handleSync} disabled={syncing} aria-busy={syncing}>
            <SyncIcon />
            {syncing ? 'Syncing...' : 'Sync Devices'}
          </Button>
        ) : null}
        {canAdd ? (
          <Link className="btn btn-primary" to="/devices/add">
            <PlusIcon />
            Add device
          </Link>
        ) : null}
      </>
    ) : null

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
          actions={jumpActions}
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
                onClick={() => toast('Design preview — export would run here.', 'info')}
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
              placeholder="Slot Id, QR, slot or location"
              aria-label="Search devices"
              disabled={loading && !rows.length}
            />
          </Field>
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {roadOptions.map((r) => (
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
                  <th>Slot Id</th>
                  <th>Slot Label</th>
                  <th>Slot Identifier</th>
                  <th>QR Number</th>
                  <th>Parking Location</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTable rows={6} cols={5} /> : null}
                {!loading && !rows.length ? (
                  <tr>
                    <td colSpan={5}>
                      <span className="muted">No devices found.</span>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? rows.map((row) => {
                      const qr = row.qrNumber || row.qr
                      return (
                        <tr key={row.id}>
                          <td>{displayOrDash(row.slotId)}</td>
                          <td>{displayOrDash(row.slotLabel)}</td>
                          <td>{displayOrDash(row.slotIdentifier)}</td>
                          <td>
                            {qr ? (
                              <Link className="code" to={`/devices/${row.id}`}>
                                {qr}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>{displayOrDash(row.parkingLocation || row.road)}</td>
                        </tr>
                      )
                    })
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
