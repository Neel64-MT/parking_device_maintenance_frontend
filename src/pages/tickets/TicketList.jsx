import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { ISSUE_MASTER } from '../../data/issueMaster'
import { ROAD_OPTIONS } from '../../data/slots'
import { TICKET_TAB_META } from '../../data/tickets'
import { ApiRequestError } from '../../services/api'
import { listTickets } from '../../services/tickets'
import { canPerm } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { Tabs } from '../../components/ui/Tabs'
import { Tile } from '../../components/ui/Tile'

const FILTER_DEFAULTS = {
  road: 'All roads',
  status: 'Open + under repair',
  category: 'All categories',
  assignee: 'Anyone',
}

const TAB_IDS = new Set(['new', 'asg', 'cls'])

function parseTab(value) {
  return TAB_IDS.has(value) ? value : 'new'
}

/** Align status filter with the active tab so they do not cancel each other out. */
function statusForTab(tab, status) {
  if (tab === 'cls') {
    if (status === 'Closed' || status === 'All') return status
    return 'Closed'
  }
  if (status === 'Closed') return FILTER_DEFAULTS.status
  return status
}

export default function TicketList() {
  const { user } = useAuth()
  const canView = canPerm(user, 'All tickets', 'v')
  const canFilterAssignee =
    user?.role === 'Admin' || user?.role === 'Project manager'
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))

  const [query, setQuery] = useState('')
  const [road, setRoad] = useState(FILTER_DEFAULTS.road)
  const [status, setStatus] = useState(() => statusForTab(tab, FILTER_DEFAULTS.status))
  const [category, setCategory] = useState(FILTER_DEFAULTS.category)
  const [assignee, setAssignee] = useState(FILTER_DEFAULTS.assignee)
  const [applied, setApplied] = useState(() => ({
    road: FILTER_DEFAULTS.road,
    status: statusForTab(tab, FILTER_DEFAULTS.status),
    category: FILTER_DEFAULTS.category,
    assignee: FILTER_DEFAULTS.assignee,
    q: '',
  }))

  const [rows, setRows] = useState([])
  const [tiles, setTiles] = useState([])
  const [tabCounts, setTabCounts] = useState({ new: 0, asg: 0, cls: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const meta = TICKET_TAB_META[tab]

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view tickets.')
          setRows([])
          setTiles([])
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
          assignee: canFilterAssignee ? applied.assignee : FILTER_DEFAULTS.assignee,
          page: 1,
          limit: 100,
        })
        if (cancelled) return
        setRows(result.rows)
        setTiles(result.tiles)
        setTabCounts(result.tabCounts)
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
  }, [canView, canFilterAssignee, tab, applied])

  function handleTab(id) {
    const nextTab = parseTab(id)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', nextTab)
        return next
      },
      { replace: true },
    )
    setQuery('')
    const nextStatus = statusForTab(nextTab, status)
    setStatus(nextStatus)
    setApplied((prev) => ({ ...prev, q: '', status: nextStatus }))
  }

  function applyFilters() {
    const nextStatus = statusForTab(tab, status)
    setStatus(nextStatus)
    setApplied({
      road,
      status: nextStatus,
      category,
      assignee: canFilterAssignee ? assignee : FILTER_DEFAULTS.assignee,
      q: query,
    })
  }

  function resetFilters() {
    setRoad(FILTER_DEFAULTS.road)
    setStatus(FILTER_DEFAULTS.status)
    setCategory(FILTER_DEFAULTS.category)
    setAssignee(FILTER_DEFAULTS.assignee)
    setQuery('')
    setApplied({
      road: FILTER_DEFAULTS.road,
      status: FILTER_DEFAULTS.status,
      category: FILTER_DEFAULTS.category,
      assignee: FILTER_DEFAULTS.assignee,
      q: '',
    })
  }

  const openCount = (tabCounts.new || 0) + (tabCounts.asg || 0)
  const crumb = `${openCount} open · ${tabCounts.cls || 0} closed`

  return (
    <>
      <PageMeta pageId="ticket-list" title="All tickets" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets/raise', label: 'Raise a ticket' },
            { to: '/tickets/update', label: 'Update a ticket' },
            { to: '/tickets/report', label: 'Work report' },
            { to: '/devices', label: 'Devices' },
          ]}
        />

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <div className="tiles five">
          {(tiles.length
            ? tiles
            : [
                { value: '—', label: 'Open, not attended', tone: 'bad' },
                { value: '—', label: 'Under repair', tone: 'warn' },
                { value: '—', label: 'Waiting for spare', tone: 'warn' },
                { value: '—', label: 'Open over 3 days', tone: 'bad' },
              ]
          ).map((t) => (
            <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
          ))}
        </div>

        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters}>Reset</Button>
              <Button variant="dark" onClick={applyFilters}>
                Apply
              </Button>
              <Button variant="dark" onClick={() => toast('Design preview — export would run here.')}>
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
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Open + under repair</option>
              <option>Open, not attended</option>
              <option>Under repair</option>
              <option>Waiting for spare</option>
              <option>Closed</option>
              <option>All</option>
            </select>
          </Field>
          <Field label="Issue category found">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All categories</option>
              {ISSUE_MASTER.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          {canFilterAssignee ? (
            <Field label="Assigned to">
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option>Anyone</option>
                <option>Ramesh Vaghela</option>
                <option>Jignesh Solanki</option>
                <option>Mahesh Thakor</option>
                <option>Not assigned</option>
              </select>
            </Field>
          ) : null}
        </FilterBar>

        <Tabs
          value={tab}
          onChange={handleTab}
          tabs={[
            { id: 'new', label: 'New', count: tabCounts.new },
            { id: 'asg', label: 'Assigned', count: tabCounts.asg },
            { id: 'cls', label: 'Closed', count: tabCounts.cls },
          ]}
          actions={
            <>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters()
                }}
                placeholder="Ticket, device or slot"
                aria-label="Search tickets"
              />
              <Link className="btn btn-primary" to="/tickets/raise">
                Raise ticket
              </Link>
            </>
          }
        />

        <Panel title={meta.title} subtitle={meta.subtitle} flush>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Device</th>
                  <th>Road / slot</th>
                  <th>Issue reported</th>
                  <th>Issue found</th>
                  <th>Assigned to</th>
                  <th className="num">Updates</th>
                  <th className="num">Days open</th>
                  <th>Status</th>
                  <th className="act" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10}>
                      <span className="muted">Loading tickets…</span>
                    </td>
                  </tr>
                ) : null}
                {!loading && !rows.length ? (
                  <tr>
                    <td colSpan={10}>
                      <span className="muted">No tickets match this view.</span>
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link className="code" to={`/tickets/${row.id}`}>
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
                          {row.assignedTo || <span className="muted">Not assigned</span>}
                        </td>
                        <td className="num">{row.updates}</td>
                        <td className={`num${row.daysBad ? ' strong-bad' : ''}`}>{row.daysOpen}</td>
                        <td>
                          <Pill tone={row.statusTone}>{row.status}</Pill>
                        </td>
                        <td className="act">
                          <Link
                            className={`btn btn-sm${row.actionPrimary ? ' btn-primary' : ''}`}
                            to={`/tickets/${row.id}`}
                          >
                            {row.actionLabel}
                          </Link>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </>
  )
}
