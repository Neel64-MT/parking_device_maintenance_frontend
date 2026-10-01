import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ISSUE_MASTER } from '../../data/issueMaster'
import { ROAD_OPTIONS } from '../../data/slots'
import { TICKET_TAB_META, TICKET_TABS } from '../../data/tickets'
import { ApiRequestError } from '../../services/api'
import { listTickets } from '../../services/tickets'
import { canPerm, homePathForUser, isFieldTicketUpdater } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { SkeletonTable, SkeletonTiles } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'
import { Tabs } from '../../components/ui/Tabs'
import { Tile } from '../../components/ui/Tile'

const FILTER_DEFAULTS = {
  road: 'All roads',
  status: 'All',
  category: 'All categories',
  age: '',
}

const URP_STATUS_OPTIONS = [
  { value: 'All', label: 'All under repair' },
  { value: 'Under repair', label: 'Under repair' },
  { value: 'Waiting for spare', label: 'Waiting for spare' },
]

const PLACEHOLDER_TILES = [
  { value: '—', label: 'Open, not attended', tone: 'bad' },
  { value: '—', label: 'Under repair', tone: 'warn' },
  { value: '—', label: 'Waiting for spare', tone: 'warn' },
  { value: '—', label: 'Open over 3 days', tone: 'bad' },
]

/** Old `asg` links land on Under repair; `new` and anything unknown land on Open. */
function parseTab(value) {
  if (value === 'urp' || value === 'cls') return value
  if (value === 'asg') return 'urp'
  return 'open'
}

/** Only Under repair has more than one status; Open and Closed always send `All`. */
function statusForTab(tab, status) {
  if (tab !== 'urp') return 'All'
  return URP_STATUS_OPTIONS.some((o) => o.value === status) ? status : 'All'
}

/** The 3-day age filter narrows Open and Under repair only. */
function ageForTab(tab, age) {
  return tab === 'cls' ? '' : age
}

/** Card click → tab + status + age. "Open over 3 days" picks Open unless only Under repair has any. */
function viewForTile(label, over3Counts) {
  if (label === 'Open, not attended') return { tab: 'open', status: 'All', age: '' }
  if (label === 'Under repair') return { tab: 'urp', status: 'Under repair', age: '' }
  if (label === 'Waiting for spare') return { tab: 'urp', status: 'Waiting for spare', age: '' }
  if (label === 'Open over 3 days') {
    const tab = !over3Counts.open && over3Counts.urp ? 'urp' : 'open'
    return { tab, status: 'All', age: 'over3' }
  }
  return null
}

function isTileSelected(label, tab, applied) {
  const status = statusForTab(tab, applied.status)
  const age = ageForTab(tab, applied.age)
  if (label === 'Open over 3 days') return age === 'over3'
  if (age) return false
  if (label === 'Open, not attended') return tab === 'open'
  if (label === 'Under repair') return tab === 'urp' && status === 'Under repair'
  if (label === 'Waiting for spare') return tab === 'urp' && status === 'Waiting for spare'
  return false
}

export default function TicketList() {
  const { user } = useAuth()
  const canView = canPerm(user, 'All tickets', 'v')
  const canRaise = canPerm(user, 'Raise ticket', 'v')
  const canViewWorkReport = canPerm(user, 'Work report', 'v')
  const showUpdateTicketLink =
    isFieldTicketUpdater(user) && canPerm(user, 'Update ticket', 'v')
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  const [query, setQuery] = useState('')
  const [road, setRoad] = useState(FILTER_DEFAULTS.road)
  const [status, setStatus] = useState(() => statusForTab(tab, FILTER_DEFAULTS.status))
  const [category, setCategory] = useState(FILTER_DEFAULTS.category)
  const [applied, setApplied] = useState(() => ({
    road: FILTER_DEFAULTS.road,
    status: statusForTab(tab, FILTER_DEFAULTS.status),
    category: FILTER_DEFAULTS.category,
    age: FILTER_DEFAULTS.age,
    q: '',
  }))

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
  const [tabCounts, setTabCounts] = useState({ open: 0, urp: 0, cls: 0 })
  const [over3Counts, setOver3Counts] = useState({ open: 0, urp: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pane, setPane] = useState({ tab, dir: '' })
  if (pane.tab !== tab) {
    setPane({
      tab,
      dir: TICKET_TABS.indexOf(tab) > TICKET_TABS.indexOf(pane.tab) ? 'next' : 'prev',
    })
    setRows([])
    setLoading(true)
  }

  const meta = TICKET_TAB_META[tab]
  const activeAge = ageForTab(tab, applied.age)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view tickets.')
          setRows([])
          setTiles([])
          setPagination({
            page: 1,
            limit,
            total: 0,
            totalPages: 1,
          })
        }
        return
      }
      if (!cancelled) {
        setLoadError('')
        setLoading(true)
      }
      try {
        const result = await listTickets({
          tab,
          q: applied.q,
          road: applied.road,
          status: statusForTab(tab, applied.status),
          category: applied.category,
          age: ageForTab(tab, applied.age),
          page,
          limit,
        })
        if (cancelled) return
        setRows(result.rows)
        setTiles(result.tiles)
        setTabCounts(result.tabCounts)
        setOver3Counts(result.over3Counts)
        setPagination(
          result.pagination || {
            page,
            limit,
            total: result.rows.length,
            totalPages: 1,
          },
        )
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load tickets.')
          setRows([])
          setTiles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [canView, tab, applied, page, limit])

  function setTabParam(nextTab) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', nextTab)
        return next
      },
      { replace: true },
    )
  }

  function handleTab(id) {
    const nextTab = parseTab(id)
    setTabParam(nextTab)
    setStatus(FILTER_DEFAULTS.status)
    setPage(1)
    setApplied((prev) => ({
      ...prev,
      status: FILTER_DEFAULTS.status,
      age: ageForTab(nextTab, prev.age),
    }))
  }

  function selectTile(label) {
    const view = viewForTile(label, over3Counts)
    if (!view) return
    setTabParam(view.tab)
    setStatus(view.status)
    setPage(1)
    setApplied((prev) => ({ ...prev, status: view.status, age: view.age }))
  }

  function applyFilters() {
    const nextStatus = statusForTab(tab, status)
    setStatus(nextStatus)
    setPage(1)
    setApplied((prev) => ({
      road,
      status: nextStatus,
      category,
      age: ageForTab(tab, prev.age),
      q: query,
    }))
  }

  function resetFilters() {
    setRoad(FILTER_DEFAULTS.road)
    setStatus(FILTER_DEFAULTS.status)
    setCategory(FILTER_DEFAULTS.category)
    setQuery('')
    setPage(1)
    setApplied({
      road: FILTER_DEFAULTS.road,
      status: FILTER_DEFAULTS.status,
      category: FILTER_DEFAULTS.category,
      age: FILTER_DEFAULTS.age,
      q: '',
    })
  }

  function handleLimitChange(nextLimit) {
    setLimit(nextLimit)
    setPage(1)
  }

  const crumb = `${tabCounts.open || 0} open · ${tabCounts.urp || 0} under repair · ${tabCounts.cls || 0} closed`
  const panelSubtitle = activeAge
    ? `${meta.subtitle} · raised more than 3 days ago`
    : meta.subtitle
  const showDaysOpen = tab !== 'cls'
  const showDaysAfterClose = tab === 'cls'
  const colCount = 9 + (showDaysOpen || showDaysAfterClose ? 1 : 0)
  const listReturn = `/tickets?tab=${tab}`
  const ticketLinkState = { from: listReturn }

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  return (
    <>
      <PageMeta pageId="ticket-list" title="All tickets" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            ...(canRaise ? [{ to: '/tickets/raise', label: 'Raise a ticket' }] : []),
            ...(showUpdateTicketLink
              ? [{ to: '/tickets/update', label: 'Update a ticket' }]
              : []),
            ...(canViewWorkReport
              ? [{ to: '/tickets/report', label: 'Work report' }]
              : []),
            { to: '/devices', label: 'Devices' },
          ]}
        />

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading && !tiles.length ? (
          <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading tickets</span>
            <SkeletonTiles count={4} />
          </div>
        ) : (
          <div className="tiles five">
            {(tiles.length ? tiles : PLACEHOLDER_TILES).map((t) => {
              if (!tiles.length || !viewForTile(t.label, over3Counts)) {
                return <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
              }
              const selected = isTileSelected(t.label, tab, applied)
              return (
                <button
                  key={t.label}
                  type="button"
                  className="tile-link"
                  onClick={() => selectTile(t.label)}
                  aria-pressed={selected}
                  disabled={loading}
                >
                  <Tile
                    value={t.value}
                    label={t.label}
                    tone={t.tone}
                    className={selected ? 'tile-selected' : ''}
                  />
                </button>
              )
            })}
          </div>
        )}

        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters}>Reset</Button>
              <Button variant="dark" onClick={applyFilters}>
                Apply
              </Button>
              <Button variant="dark" onClick={() => toast('Design preview — export would run here.', 'info')}>
                Export
              </Button>
            </>
          }
        >
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {ROAD_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          {tab === 'urp' ? (
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {URP_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Issue category">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All categories</option>
              {ISSUE_MASTER.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
        </FilterBar>

        <Tabs
          value={tab}
          onChange={handleTab}
          tabs={[
            { id: 'open', label: 'Open', count: tabCounts.open },
            { id: 'urp', label: 'Under Repair', count: tabCounts.urp },
            { id: 'cls', label: 'Closed', count: tabCounts.cls },
          ]}
          actions={
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters()
              }}
              placeholder="Ticket, slot id or road"
              aria-label="Search tickets"
            />
          }
        />

        <Panel
          key={tab}
          className={`tab-pane${pane.dir ? ` tab-pane-${pane.dir}` : ''}`}
          title={meta.title}
          subtitle={panelSubtitle}
          flush
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Slot Id</th>
                  <th>Road / slot</th>
                  <th>Issue reported</th>
                  <th>Issue found</th>
                  <th>Raised by</th>
                  <th className="num">Updates</th>
                  {showDaysOpen ? <th className="num">Days open</th> : null}
                  {showDaysAfterClose ? <th className="num">Days After Close</th> : null}
                  <th>Status</th>
                  <th className="act" />
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTable rows={6} cols={colCount} /> : null}
                {!loading && !rows.length ? (
                  <tr>
                    <td colSpan={colCount}>
                      <span className="muted">No tickets match this view.</span>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link className="code" to={`/tickets/${row.id}`} state={ticketLinkState}>
                            {row.id}
                          </Link>
                        </td>
                        <td>
                          <Link className="code" to={`/devices/${row.deviceId}`}>
                            {row.deviceId}
                          </Link>
                        </td>
                        <td>
                          {row.road}
                          <div className="muted">{row.slot}</div>
                        </td>
                        <td>
                          {row.issueReported}
                          {row.issueReportedDetail ? (
                            <div className="muted">{row.issueReportedDetail}</div>
                          ) : null}
                        </td>
                        <td>
                          {row.issueFound ? (
                            <>
                              {row.issueFound}
                              {row.issueFoundDetail ? (
                                <div className="muted">{row.issueFoundDetail}</div>
                              ) : null}
                            </>
                          ) : (
                            <span className="muted">Not inspected yet</span>
                          )}
                        </td>
                        <td>
                          {row.raisedBy || <span className="muted">—</span>}
                        </td>
                        <td className="num">{row.updates}</td>
                        {showDaysOpen ? (
                          <td className={`num${row.daysBad ? ' strong-bad' : ''}`}>{row.daysOpen}</td>
                        ) : null}
                        {showDaysAfterClose ? (
                          <td className="num">
                            {row.daysAfterClose != null ? row.daysAfterClose : '—'}
                          </td>
                        ) : null}
                        <td>
                          <Pill tone={row.statusTone}>{row.status}</Pill>
                        </td>
                        <td className="act">
                          <div className="act-row">
                            <Link
                              className="btn btn-sm"
                              to={`/tickets/${row.id}`}
                              state={ticketLinkState}
                            >
                              Open
                            </Link>
                          </div>
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
