import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ISSUE_MASTER } from '../../data/issueMaster'
import { ROAD_OPTIONS } from '../../data/slots'
import { TICKET_TAB_META } from '../../data/tickets'
import { ApiRequestError } from '../../services/api'
import { assignTicket, listTickets } from '../../services/tickets'
import { canPerm, isFieldTicketUpdater, listTechnicianLookups } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Modal } from '../../components/ui/Modal'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { SkeletonTable, SkeletonTiles } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'
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
  const canAssign = canPerm(user, 'All tickets', 'a')
  const canViewWorkReport = canPerm(user, 'Work report', 'v')
  const showUpdateTicketLink = isFieldTicketUpdater(user)
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
  const [tabCounts, setTabCounts] = useState({ new: 0, asg: 0, cls: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [listVersion, setListVersion] = useState(0)

  const [assignRow, setAssignRow] = useState(null)
  const [assigneeId, setAssigneeId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const assignSavingRef = useRef(false)
  const [assignHandError, setAssignHandError] = useState('')
  const [techOptions, setTechOptions] = useState([])
  const [techsLoading, setTechsLoading] = useState(false)

  const meta = TICKET_TAB_META[tab]
  const assignOpen = Boolean(assignRow)
  const assignIsReassign = Boolean(assignRow?.assignedTo)

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
          assignee: canFilterAssignee ? applied.assignee : FILTER_DEFAULTS.assignee,
          page,
          limit,
        })
        if (cancelled) return
        setRows(result.rows)
        setTiles(result.tiles)
        setTabCounts(result.tabCounts)
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
  }, [canView, canFilterAssignee, tab, applied, page, limit, listVersion])

  useEffect(() => {
    if (!canAssign) return undefined
    let cancelled = false
    const id = window.setTimeout(() => {
      setTechsLoading(true)
      listTechnicianLookups()
        .then((list) => {
          if (!cancelled) setTechOptions((list || []).filter((t) => t.id))
        })
        .catch((err) => {
          if (!cancelled) {
            setTechOptions([])
            toastApiError(err, 'Could not load workers.')
          }
        })
        .finally(() => {
          if (!cancelled) setTechsLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [canAssign])

  function resolveRowAssigneeId(row) {
    if (!row) return ''
    if (row.assigneeId) return String(row.assigneeId)
    const name = String(row.assignedTo || '').trim()
    if (!name) return ''
    const match = techOptions.find(
      (t) => t.label === name || t.name === name || String(t.label || '').startsWith(name),
    )
    return match?.id ? String(match.id) : ''
  }

  function openAssignForm(row) {
    setAssignHandError('')
    setAssignReason('')
    setAssigneeId(resolveRowAssigneeId(row))
    setAssignRow(row)
  }

  function closeAssignForm() {
    if (assignSavingRef.current) return
    setAssignRow(null)
    setAssigneeId('')
    setAssignReason('')
    setAssignHandError('')
  }

  function setAssignBusy(busy) {
    assignSavingRef.current = busy
    setAssignSaving(busy)
  }

  async function submitAssign(e) {
    e.preventDefault()
    if (assignSavingRef.current || !assignRow?.id) return
    const selected = String(assigneeId || '').trim()
    if (!selected) {
      setAssignHandError('Select a worker to hand this ticket to.')
      return
    }
    setAssignHandError('')
    setAssignBusy(true)
    try {
      const result = await assignTicket(assignRow.id, {
        assigneeId: selected,
        reason: assignReason,
        isFirstAssign: !assignRow.assignedTo,
      })
      toastApiSuccess(
        result?.assigneeName
          ? `Assigned to ${result.assigneeName}.`
          : 'Ticket assigned.',
      )
      setAssignBusy(false)
      closeAssignForm()
      setListVersion((v) => v + 1)
    } catch (err) {
      if (err instanceof ApiRequestError && Array.isArray(err.details)) {
        const hand = err.details.find(
          (d) => d?.field === 'assigneeId' || d?.field === 'assignee',
        )
        if (hand?.message) setAssignHandError(String(hand.message))
      }
      toastApiError(err, 'Could not save assignment.')
      setAssignBusy(false)
    }
  }

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
    const nextStatus = statusForTab(nextTab, status)
    setStatus(nextStatus)
    setPage(1)
    setApplied((prev) => ({ ...prev, status: nextStatus }))
  }

  function applyFilters() {
    const nextStatus = statusForTab(tab, status)
    setStatus(nextStatus)
    setPage(1)
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
    setPage(1)
    setApplied({
      road: FILTER_DEFAULTS.road,
      status: FILTER_DEFAULTS.status,
      category: FILTER_DEFAULTS.category,
      assignee: FILTER_DEFAULTS.assignee,
      q: '',
    })
  }

  function handleLimitChange(nextLimit) {
    setLimit(nextLimit)
    setPage(1)
  }

  const openCount = (tabCounts.new || 0) + (tabCounts.asg || 0)
  const crumb = `${openCount} open · ${tabCounts.cls || 0} closed`
  const showUpdates = tab !== 'new'
  const showDaysOpen = tab !== 'cls'
  const showDaysAfterClose = tab === 'cls'
  const colCount =
    9 + (showUpdates ? 1 : 0) + (showDaysOpen || showDaysAfterClose ? 1 : 0) + 1
  const listReturn = `/tickets?tab=${tab}`
  const ticketLinkState = { from: listReturn }

  return (
    <>
      <PageMeta pageId="ticket-list" title="All tickets" crumb={crumb} />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets/raise', label: 'Raise a ticket' },
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

        {loading ? (
          <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading tickets</span>
            <SkeletonTiles count={4} />
          </div>
        ) : (
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
            { id: 'new', label: 'Open', count: tabCounts.new },
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
                placeholder="Ticket, slot id or road"
                aria-label="Search tickets"
              />
              <Link className="btn btn-primary" to="/tickets/raise" state={ticketLinkState}>
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
                  <th>Slot Id</th>
                  <th>Road / slot</th>
                  <th>Issue reported</th>
                  <th>Issue found</th>
                  <th>Raised by</th>
                  <th>Assigned to</th>
                  {showUpdates ? <th className="num">Updates</th> : null}
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
                        <td>
                          {row.assignedTo || <span className="muted">Not assigned</span>}
                        </td>
                        {showUpdates ? <td className="num">{row.updates}</td> : null}
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
                            {canAssign &&
                            row.status !== 'Closed' &&
                            row.assignedTo ? (
                              <Button
                                size="sm"
                                className="btn-reassign"
                                onClick={() => openAssignForm(row)}
                              >
                                Reassign
                              </Button>
                            ) : null}
                            {canAssign &&
                            row.status !== 'Closed' &&
                            !row.assignedTo &&
                            row.actionLabel === 'Assign' ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => openAssignForm(row)}
                              >
                                Assign
                              </Button>
                            ) : (
                              <Link
                                className={`btn btn-sm${
                                  row.actionPrimary && row.actionLabel !== 'Assign'
                                    ? ' btn-primary'
                                    : ''
                                }`}
                                to={`/tickets/${row.id}`}
                                state={ticketLinkState}
                              >
                                {row.actionLabel === 'Assign' ? 'Open' : row.actionLabel}
                              </Link>
                            )}
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

      <Modal
        open={assignOpen && canAssign}
        title={assignIsReassign ? 'Reassign ticket' : 'Assign ticket'}
        subtitle={
          assignIsReassign
            ? `Hand ${assignRow?.id || 'this ticket'} to another worker`
            : `Choose who should hold ${assignRow?.id || 'this ticket'}`
        }
        onClose={closeAssignForm}
        closeDisabled={assignSaving}
        wide
      >
        {assignOpen && canAssign ? (
          <form onSubmit={submitAssign}>
            <div className="row">
              <Field label="Hand to">
                <select
                  value={assigneeId}
                  disabled={techsLoading || assignSaving}
                  onChange={(e) => {
                    setAssigneeId(e.target.value)
                    setAssignHandError('')
                  }}
                  aria-invalid={Boolean(assignHandError)}
                >
                  <option value="">
                    {techsLoading ? 'Loading workers…' : 'Select worker'}
                  </option>
                  {techOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label || t.name}
                    </option>
                  ))}
                </select>
                {assignHandError ? (
                  <p className="muted" style={{ color: 'var(--bad)', marginTop: 6 }}>
                    {assignHandError}
                  </p>
                ) : null}
              </Field>
              <Field label="Note">
                <input
                  type="text"
                  placeholder="Optional note"
                  value={assignReason}
                  disabled={assignSaving}
                  onChange={(e) => setAssignReason(e.target.value)}
                />
              </Field>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={assignSaving || techsLoading}
                aria-busy={assignSaving}
              >
                {assignSaving ? 'Loading…' : assignIsReassign ? 'Reassign' : 'Assign'}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={assignSaving}
                onClick={closeAssignForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  )
}
