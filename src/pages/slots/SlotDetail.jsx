import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ApiRequestError } from '../../services/api'
import { getSlot } from '../../services/slotView'
import { deleteTicket, listTickets } from '../../services/tickets'
import { canPerm, homePathForUser } from '../../services/users'
import { TicketTable } from '../../components/tickets/TicketTable'
import { groupIssuesForDisplay } from '../../components/tickets/ticketIssueRowsHelpers'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { SkeletonText } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'

function slotErrorMessage(err, fallback) {
  if (!(err instanceof ApiRequestError)) return fallback
  if (err.status === 404) return 'Slot not found.'
  if (err.status === 403) return 'You do not have access to this slot.'
  return err.message
}

/** Open Sub Issues grouped by Main Issue; each links to the ticket(s) that hold it. */
function UnresolvedIssueList({ issues, linkState, linkTickets }) {
  const groups = groupIssuesForDisplay(issues)
  if (!groups.length) {
    return (
      <EmptyState title="No unresolved issues">
        Every issue reported on this slot&apos;s tickets is resolved.
      </EmptyState>
    )
  }
  return (
    <div className="issue-groups">
      {groups.map((g) => (
        <div key={g.key} className="issue-group">
          <div className="issue-group-head">
            <span className="issue-group-name">{g.category}</span>
            <span className="issue-group-count">{g.subs.length} open</span>
          </div>
          <ul className="issue-list">
            {g.subs.map((s) => (
              <li key={s.key} className="issue-row">
                <span className="issue-row-label">{s.label}</span>
                <span className="slot-issue-tickets">
                  {s.tickets.map((t) =>
                    linkTickets ? (
                      <Link key={t.id} className="code" to={`/tickets/${t.id}`} state={linkState}>
                        {t.id}
                      </Link>
                    ) : (
                      <span key={t.id} className="code">
                        {t.id}
                      </span>
                    ),
                  )}
                </span>
                <Pill tone="bad">Open</Pill>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** One slot: header, unresolved issues (Open only) and every ticket (all statuses). */
export default function SlotDetail() {
  const { slotId } = useParams()
  const { user } = useAuth()
  const canView = canPerm(user, 'Slot View', 'v')
  /** Ticket rows and ticket pages are gated on All tickets v, separately from Slot View. */
  const canViewTickets = canPerm(user, 'All tickets', 'v')
  const canDeleteTickets = canPerm(user, 'All tickets', 'd')
  const canViewDevice = canPerm(user, 'Device history', 'v')

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketsError, setTicketsError] = useState('')
  // Bumped after a delete so both the slot header (ticketCount, unresolvedIssues) and the
  // ticket table re-fetch.
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!canView || !slotId) return undefined
    let cancelled = false

    async function load() {
      setLoadError('')
      setLoading(true)
      try {
        const data = await getSlot(slotId)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) {
          setLoadError(slotErrorMessage(err, 'Could not load slot.'))
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, slotId, refreshKey])

  useEffect(() => {
    if (!canView || !canViewTickets || !slotId) return undefined
    let cancelled = false

    async function load() {
      setTicketsError('')
      setTicketsLoading(true)
      try {
        const result = await listTickets({ device: slotId, page, limit })
        if (cancelled) return
        setTickets(result.rows)
        setPagination(result.pagination)
      } catch (err) {
        if (!cancelled) {
          setTicketsError(slotErrorMessage(err, 'Could not load tickets.'))
          setTickets([])
        }
      } finally {
        if (!cancelled) setTicketsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, canViewTickets, slotId, page, limit, refreshKey])

  async function confirmDeleteTicket() {
    if (!deleteTarget || deletingId) return
    setDeletingId(deleteTarget.id)
    try {
      const { message } = await deleteTicket(deleteTarget.id)
      toastApiSuccess(message)
      setDeleteTarget(null)
      // Refresh both the slot header counts and the ticket table.
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toastApiError(err, 'Could not delete ticket.')
    } finally {
      setDeletingId(null)
    }
  }

  const slot = detail?.slot
  const unresolvedIssues = useMemo(() => detail?.unresolvedIssues || [], [detail])
  const linkState = useMemo(() => ({ from: `/slot-view/${slotId}` }), [slotId])

  const crumb = useMemo(() => {
    if (!slot) return null
    return (
      <>
        <Link to="/slot-view">Slot View</Link> › {slot.road}, Slot {slot.slotLabel || '—'}
      </>
    )
  }, [slot])

  const actions = useMemo(() => {
    if (!slot || !canViewDevice) return null
    return (
      <Link className="btn" to={`/devices/${encodeURIComponent(slot.id)}`}>
        Device history
      </Link>
    )
  }, [slot, canViewDevice])

  function handleLimitChange(nextLimit) {
    setLimit(nextLimit)
    setPage(1)
  }

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  return (
    <>
      <PageMeta
        pageId="slot-detail"
        title={slot ? `Slot ${slot.slotLabel || slot.id}` : 'Slot'}
        crumb={crumb}
        actions={actions}
      />

      <main className="page">
        <Link className="back-link" to="/slot-view">
          ← Back to Slot View
        </Link>

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? (
          <section className="record" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading slot</span>
            <SkeletonText lines={3} />
          </section>
        ) : null}

        {!loading && slot ? (
          <>
            <section className="record">
              <div className="record-top">
                <div className="record-head">
                  <div className="record-title">
                    <h3>Slot {slot.slotLabel || '—'}</h3>
                  </div>
                  <div className="sub">
                    Slot Id <b className="code">{slot.id}</b> · {slot.road}
                  </div>
                </div>
              </div>
              <div className="facts">
                <div>
                  <small>Slot Label</small>
                  <span>{slot.slotLabel || '—'}</span>
                </div>
                <div>
                  <small>Slot Id</small>
                  <span>{slot.id}</span>
                </div>
                <div>
                  <small>Road</small>
                  <span>{slot.road}</span>
                </div>
                <div>
                  <small>Tickets</small>
                  <span>{detail.ticketCount}</span>
                </div>
                <div>
                  <small>Unresolved issues</small>
                  <span className={unresolvedIssues.length ? 'strong-bad' : undefined}>
                    {unresolvedIssues.length}
                  </span>
                </div>
              </div>
            </section>

            <Panel
              title="Unresolved issues"
              subtitle="Open issues across every ticket for this slot · resolved issues are hidden"
            >
              <UnresolvedIssueList
                issues={unresolvedIssues}
                linkState={linkState}
                linkTickets={canViewTickets}
              />
            </Panel>

            {canViewTickets ? (
              <Panel title="Tickets" subtitle="Every ticket for this slot, newest first" flush>
                {ticketsError ? (
                  <div className="hint-strip auth-error" role="alert" style={{ margin: 16 }}>
                    <span>{ticketsError}</span>
                  </div>
                ) : null}
                <TicketTable
                  rows={tickets}
                  loading={ticketsLoading}
                  showDaysOpen
                  showSlot={false}
                  linkState={linkState}
                  emptyText="No tickets raised for this slot yet."
                  canDelete={canDeleteTickets}
                  onDelete={(row) => setDeleteTarget(row)}
                  deletingId={deletingId}
                />
                <TablePagination
                  page={pagination.page || page}
                  limit={limit}
                  total={pagination.total || 0}
                  totalPages={pagination.totalPages || 1}
                  disabled={ticketsLoading}
                  onPageChange={setPage}
                  onLimitChange={handleLimitChange}
                />
              </Panel>
            ) : (
              <Panel title="Tickets">
                <EmptyState title="Ticket list not available">
                  Your role cannot view tickets. Ask an admin to grant All tickets view in Roles
                  &amp; permissions.
                </EmptyState>
              </Panel>
            )}
          </>
        ) : null}
      </main>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete this ticket?"
        subtitle={deleteTarget ? `${deleteTarget.id} · ${deleteTarget.road || slot?.road || ''}` : undefined}
        onClose={deletingId ? undefined : () => setDeleteTarget(null)}
        closeDisabled={Boolean(deletingId)}
      >
        <p>
          Ticket {deleteTarget?.id} will be removed from all ticket lists, counts, Slot View and
          reports. Its history is kept. This cannot be undone from here.
        </p>
        <div className="modal-actions">
          <Button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeleteTicket}
            disabled={Boolean(deletingId)}
            aria-busy={Boolean(deletingId)}
          >
            {deletingId ? 'Deleting…' : 'Delete ticket'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
