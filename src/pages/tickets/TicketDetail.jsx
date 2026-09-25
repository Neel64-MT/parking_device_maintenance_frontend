import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { assignTicket, getTicket } from '../../services/tickets'
import {
  canPerm,
  isDashboardRole,
  isFieldTicketUpdater,
  isOpsTicketUpdater,
  listTechnicianLookups,
} from '../../services/users'
import { TicketAddUpdateForm } from '../../components/tickets/TicketAddUpdateForm'
import { groupIssuesForDisplay } from '../../components/tickets/ticketIssueRowsHelpers'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { ImagePreviewModal } from '../../components/ui/ImagePreviewModal'
import { Modal } from '../../components/ui/Modal'
import { Pill } from '../../components/ui/Pill'
import { TicketDetailSkeleton } from '../../components/ui/Skeleton'

function ScanQrIcon() {
  return (
    <svg
      className="ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      style={{ width: 16, height: 16, marginRight: 6, verticalAlign: '-2px' }}
    >
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </svg>
  )
}

function IssueClassificationList({ issues, emptyBig = '—', emptySub = '—' }) {
  const groups = groupIssuesForDisplay(issues)
  if (!groups.length) {
    return (
      <>
        <div className="big">{emptyBig}</div>
        <div className="sub2">{emptySub}</div>
      </>
    )
  }
  return (
    <div className="issue-groups">
      {groups.map((g) => (
        <div key={g.key} className="issue-group">
          <div className="big">{g.category}</div>
          <ul className="issue-list">
            {g.subs.map((s) => (
              <li key={s.key}>{s.label}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** Local time: DD/MM/YYYY at HH:MM AM/PM */
function formatRaisedOn(value) {
  if (value == null || value === '') return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const hh = String(hours).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} at ${hh}:${minutes} ${ampm}`
}

function factDisplayValue(fact) {
  if (!fact) return ''
  if (fact.label === 'Raised on') return formatRaisedOn(fact.value)
  return fact.value
}

function TimelineMeta({ item }) {
  if (!item) return null
  if (item.kind === 'nextVisit') {
    return (
      <span>
        Next visit <b>{item.date}</b>
      </span>
    )
  }
  if (item.kind === 'cost') {
    return (
      <span>
        Cost today <b>{item.amount}</b>
      </span>
    )
  }
  return <span>{item.text}</span>
}

function normalizePhotos(photos) {
  if (!photos) return []
  if (typeof photos === 'string') {
    try {
      const parsed = JSON.parse(photos)
      return normalizePhotos(parsed)
    } catch {
      const one = photos.trim()
      return one ? [one] : []
    }
  }
  if (!Array.isArray(photos)) return []
  return photos.map((p) => String(p || '').trim()).filter(Boolean)
}

function normalizeParts(parts) {
  if (!parts) return []
  if (typeof parts === 'string') {
    try {
      return normalizeParts(JSON.parse(parts))
    } catch {
      return []
    }
  }
  if (!Array.isArray(parts)) return []
  return parts
    .map((p) => {
      if (!p) return null
      if (typeof p === 'string') return { name: p }
      const name = String(p.name || '').trim()
      if (!name) return null
      const amount = p.amount != null && p.amount !== '' ? Number(p.amount) : null
      return {
        id: p.id,
        name,
        amount: amount != null && !Number.isNaN(amount) ? amount : null,
      }
    })
    .filter(Boolean)
}

function normalizeViewUpdateIssues(issues) {
  if (!Array.isArray(issues)) return []
  return issues
    .map((issue) => ({
      ...issue,
      category: issue?.category || issue?.categoryName || '—',
      sub: issue?.sub || issue?.subcategory || issue?.subCategory || '—',
    }))
    .filter((issue) => issue.category !== '—' || issue.sub !== '—')
}

function ViewUpdateIssueList({ item, reportedIssues, foundIssues }) {
  const isRaised = Boolean(item?.isRaisedEvent)
  const hasEventIssue = Boolean(item?.issues?.length || item?.category || item?.subcategory)
  const structured = item?.issues?.length
    ? item.issues
    : isRaised
      ? reportedIssues
      : hasEventIssue
        ? foundIssues
        : []
  const fallback = item?.category || item?.subcategory
    ? [{ category: item.category, sub: item.subcategory }]
    : []
  const issues = normalizeViewUpdateIssues(structured?.length ? structured : fallback)
  const groups = groupIssuesForDisplay(issues)
  const categoryCount = groups.length
  const subcategoryCount = groups.reduce((total, group) => total + group.subs.length, 0)
  const label = isRaised ? 'Reported issues' : 'Issues found'
  const summary = `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} · ${subcategoryCount} ${
    subcategoryCount === 1 ? 'sub-category' : 'sub-categories'
  }`

  if (!groups.length) return null

  return (
    <div className="view-update-issues">
      <div className="view-update-issues-head">
        <div>
          <small>{label}</small>
          <strong>{summary}</strong>
        </div>
      </div>
      <div className="view-update-issue-groups">
        {groups.map((group) => (
          <div className="view-update-issue-group" key={group.key}>
            <div className="view-update-issue-category">
              <span>Issue category</span>
              <strong>{group.category}</strong>
            </div>
            <div className="view-update-issue-subs">
              <span>Sub-categories</span>
              <div className="view-update-sub-list">
                {group.subs.map((sub) => (
                  <span className="view-update-sub" key={sub.key}>
                    {sub.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** View Update details only — never includes photos / ImagePreviewModal. */
function ViewUpdateDetails({ item, reportedIssues, foundIssues }) {
  if (!item) return null
  const whenLabel = formatRaisedOn(item.when)
  const costLabel =
    item.cost != null && Number(item.cost) > 0
      ? `₹ ${Number(item.cost).toLocaleString('en-IN')}`
      : ''
  const nextVisit = item.nextVisit ? String(item.nextVisit).slice(0, 10) : ''
  const parts = item.parts || []
  const extraMeta = (item.meta || []).filter((m) => m.kind !== 'nextVisit' && m.kind !== 'cost')
  const isRaised = item.isRaisedEvent
  const rawBody = String(item.body || '').trim()
  const hasWhatHappening = Boolean(rawBody && !/^ticket\s+raised$/i.test(rawBody))
  const whatWasDone = !isRaised ? item.workDone || item.body || '' : ''
  const note = item.note || ''

  return (
    <div className="view-update-facts">
      {whenLabel ? (
        <div>
          <small>When</small>
          <span>{whenLabel}</span>
        </div>
      ) : null}
      {item.actor ? (
        <div>
          <small>By</small>
          <span>{item.actor}</span>
        </div>
      ) : null}
      {item.title ? (
        <div>
          <small>Update type</small>
          <span>{item.title}</span>
        </div>
      ) : null}
      {item.status ? (
        <div>
          <small>Status</small>
          <span>{item.status}</span>
        </div>
      ) : null}
      <ViewUpdateIssueList item={item} reportedIssues={reportedIssues} foundIssues={foundIssues} />
      {isRaised ? (
        <div>
          <small>What is happening</small>
          {hasWhatHappening ? (
            <p>{rawBody}</p>
          ) : (
            <p className="view-update-empty">No description provided</p>
          )}
        </div>
      ) : null}
      {whatWasDone ? (
        <div>
          <small>What was done</small>
          <p>{whatWasDone}</p>
        </div>
      ) : null}
      {note ? (
        <div>
          <small>Note</small>
          <p>{note}</p>
        </div>
      ) : null}
      {parts.length ? (
        <div>
          <small>Parts changed</small>
          <span>
            {parts
              .map((p) =>
                p.amount != null ? `${p.name} (₹${Number(p.amount).toLocaleString('en-IN')})` : p.name,
              )
              .join(', ')}
          </span>
        </div>
      ) : null}
      {costLabel ? (
        <div>
          <small>Cost</small>
          <span>{costLabel}</span>
        </div>
      ) : null}
      {nextVisit ? (
        <div>
          <small>Next visit</small>
          <span>{nextVisit}</span>
        </div>
      ) : null}
      {extraMeta.length ? (
        <div>
          <small>Other</small>
          <span>
            {extraMeta.map((m, i) => (
              <span key={i}>
                {i > 0 ? ' · ' : ''}
                <TimelineMeta item={m} />
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** Prefer returning to All tickets with the same tab query when navigated from the list. */
function ticketsListReturnPath(from) {
  if (typeof from !== 'string') return '/tickets'
  const [pathname, query = ''] = from.split('?')
  if (pathname !== '/tickets') return '/tickets'
  return query ? `/tickets?${query}` : '/tickets'
}

function mapWorkHistory(events) {
  const mapped = (events || []).map((e) => {
    const meta = []
    if (e.nextVisit) meta.push({ kind: 'nextVisit', date: String(e.nextVisit).slice(0, 10) })
    if (e.cost != null && Number(e.cost) > 0) {
      meta.push({ kind: 'cost', amount: `₹ ${Number(e.cost).toLocaleString('en-IN')}` })
    }
    const closed = String(e.status || '').toLowerCase().includes('closed')
    const title = e.title || e.actor || 'Update'
    const body = e.body || ''
    const eventType = String(e.eventType || e.event_type || '').toLowerCase()
    const isRaisedEvent =
      eventType === 'raised' || /^ticket\s+raised$/i.test(title)
    const isAssignmentEvent =
      eventType === 'assigned' ||
      /^assigned$/i.test(title) ||
      /ticket\s+re-?assigned/i.test(body) ||
      /ticket\s+assigned/i.test(body)
    return {
      when: e.when,
      actor: e.actor || '',
      title,
      body,
      status: e.status || '',
      statusClass: closed ? 'ok' : 'warn',
      tone: closed ? 'ok' : undefined,
      cost: e.cost,
      nextVisit: e.nextVisit || null,
      parts: normalizeParts(e.parts),
      meta: meta.length ? meta : null,
      photos: normalizePhotos(e.photos),
      category: e.category || '',
      subcategory: e.subcategory || '',
      issues: Array.isArray(e.issues) ? e.issues : [],
      workDone: e.workDone || '',
      note: e.note || '',
      isRaisedEvent,
      isAssignmentEvent,
    }
  })
  // Chronological: oldest first, newest at the bottom
  return mapped.slice().reverse()
}

export default function TicketDetail() {
  const { ticketId } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const canView = canPerm(user, 'All tickets', 'v')
  const canAssign = canPerm(user, 'All tickets', 'a')
  const canUpdateTicketView = canPerm(user, 'Update ticket', 'v')
  const pickVisitedBy = isDashboardRole(user)
  const backToTickets = ticketsListReturnPath(location.state?.from)
  const fromHere = `${location.pathname}${location.search}`

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [updOpen, setUpdOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(() => Boolean(location.state?.openAssign))
  const [assigneeId, setAssigneeId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)
  const assignSavingRef = useRef(false)
  const [assignHandError, setAssignHandError] = useState('')
  const [techOptions, setTechOptions] = useState([])
  const [techsLoading, setTechsLoading] = useState(false)
  const [previewImages, setPreviewImages] = useState(null)
  const [viewingUpdate, setViewingUpdate] = useState(null)

  function openAddUpdateModal() {
    setUpdOpen(true)
  }

  function resetAssignForm(nextAssigneeId = '') {
    setAssigneeId(nextAssigneeId)
    setAssignReason('')
    setAssignHandError('')
  }

  function closeAssignForm() {
    if (assignSavingRef.current) return
    setAssignOpen(false)
    setAssignHandError('')
    setAssignReason('')
  }

  function setAssignBusy(busy) {
    assignSavingRef.current = busy
    setAssignSaving(busy)
  }

  async function reloadTicket() {
    if (!ticketId) return
    const data = await getTicket(ticketId)
    setTicket(data)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view tickets.')
        }
        return
      }
      if (!ticketId) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('Ticket not found.')
        }
        return
      }
      if (!cancelled) {
        setLoadError('')
        setLoading(true)
      }
      try {
        const data = await getTicket(ticketId)
        if (!cancelled) setTicket(data)
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiRequestError
              ? err.status === 403
                ? 'You do not have access to this ticket.'
                : err.message
              : 'Could not load ticket.'
          setLoadError(msg)
          setTicket(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, ticketId])

  const header = ticket?.header
  const classification = ticket?.classification
  const issuesReported = ticket?.issuesReported
  const issuesFound = ticket?.issuesFound

  const reportedIssues = useMemo(() => {
    if (Array.isArray(issuesReported) && issuesReported.length) {
      return issuesReported
    }
    const r = classification?.reported
    if (r?.category || r?.sub) return [r]
    return []
  }, [issuesReported, classification])

  const foundIssues = useMemo(() => {
    if (Array.isArray(issuesFound) && issuesFound.length) {
      return issuesFound
    }
    const f = classification?.found
    if (f?.category || f?.sub) return [f]
    return []
  }, [issuesFound, classification])

  const workHistory = useMemo(() => mapWorkHistory(ticket?.workHistory), [ticket])
  const assignmentTrail = ticket?.assignmentTrail || []
  const devicePreviousTickets = ticket?.devicePreviousTickets || []
  const assignedTo =
    (header?.facts || []).find((f) => f.label === 'Assigned to')?.value || ''
  const isAssigned = Boolean(assignedTo && assignedTo !== 'Not assigned')
  const isTicketAssignee = Boolean(user?.id && ticket?.assigneeId === user.id)
  const showAddUpdate =
    canUpdateTicketView &&
    header?.status !== 'Closed' &&
    isAssigned &&
    (isOpsTicketUpdater(user) || isTicketAssignee)
  const showFieldUpdateTicket =
    isFieldTicketUpdater(user) && canUpdateTicketView && isAssigned && !isTicketAssignee
  const canManageAssign = canAssign && header && header.status !== 'Closed'
  const canReassign = canManageAssign && isAssigned
  const canFirstAssign = canManageAssign && !isAssigned

  useEffect(() => {
    if (!canAssign) return undefined
    let cancelled = false
    // Defer setState so the effect does not synchronously cascade (react-hooks/set-state-in-effect).
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

  function openAssignForm() {
    resetAssignForm(ticket?.assigneeId ? String(ticket.assigneeId) : '')
    setAssignOpen(true)
  }

  // Prefill Hand to when the form opens (incl. list deep-link openAssign).
  useEffect(() => {
    if (!assignOpen) return undefined
    const next = ticket?.assigneeId ? String(ticket.assigneeId) : ''
    const id = window.setTimeout(() => {
      setAssigneeId(next)
      setAssignReason('')
      setAssignHandError('')
    }, 0)
    return () => window.clearTimeout(id)
  }, [assignOpen, ticket?.assigneeId])

  const crumb = useMemo(() => {
    if (!header) return null
    return (
      <>
        <Link to={backToTickets}>Tickets</Link> ›{' '}
        <Link to={`/devices/${header.deviceId}`}>{header.deviceId}</Link> › {header.road}, Slot{' '}
        {header.slot}
      </>
    )
  }, [header, backToTickets])

  const actions = useMemo(() => {
    if (!header) return null
    return (
      <Link className="btn" to={`/devices/${header.deviceId}`}>
        Device history
      </Link>
    )
  }, [header])

  async function submitAssign(e) {
    e.preventDefault()
    if (assignSavingRef.current) return
    const selected = String(assigneeId || '').trim()
    if (!selected) {
      setAssignHandError('Select a worker to hand this ticket to.')
      return
    }
    setAssignHandError('')
    setAssignBusy(true)
    try {
      const result = await assignTicket(ticketId, {
        assigneeId: selected,
        reason: assignReason,
        isFirstAssign: !ticket?.assigneeId,
      })
      toastApiSuccess(
        result?.assigneeName
          ? `Assigned to ${result.assigneeName}.`
          : 'Ticket assigned.',
      )
      setAssignBusy(false)
      closeAssignForm()
      await reloadTicket()
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

  const reportedLabel = reportedIssues
    .map((i) => [i.category, i.sub].filter(Boolean).join(' › '))
    .filter(Boolean)
    .join('; ')
  const foundLabel = foundIssues
    .map((i) => [i.category, i.sub].filter(Boolean).join(' › '))
    .filter(Boolean)
    .join('; ')
  const showReclass = Boolean(reportedLabel && foundLabel && reportedLabel !== foundLabel)

  return (
    <>
      <PageMeta
        pageId="ticket-detail"
        title={header?.id || ticketId || 'Ticket'}
        crumb={crumb}
        actions={actions}
      />

      <main className="page">
        <Link className="back-link" to={backToTickets}>
          ← Back to tickets
        </Link>

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? <TicketDetailSkeleton /> : null}

        {!loading && header ? (
          <>
            <section className="record">
              <div className="record-top">
                <div>
                  <h3>{header.id}</h3>
                  <div className="sub">
                    Slot Id{' '}
                    <Link className="code" to={`/devices/${header.deviceId}`}>
                      {header.deviceId}
                    </Link>{' '}
                    · <Link to="/devices">{header.road}</Link> · Slot <b>{header.slot}</b>
                  </div>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <Pill tone={header.statusTone}>{header.status}</Pill>
                </div>
                <div className="push">
                  {showAddUpdate ? (
                    <Button onClick={openAddUpdateModal}>Add update</Button>
                  ) : null}
                  {showFieldUpdateTicket && header?.id ? (
                    <Link
                      className="btn"
                      to={`/tickets/update?ticketId=${encodeURIComponent(header.id)}`}
                      state={{ from: location.state?.from || fromHere, ticketId: header.id }}
                    >
                      <ScanQrIcon />
                      Update Ticket
                    </Link>
                  ) : null}
                      {canReassign ? (
                        <Button onClick={openAssignForm}>Reassign</Button>
                      ) : null}
                      {canFirstAssign ? (
                        <Button variant="primary" onClick={openAssignForm}>
                          Assign
                        </Button>
                      ) : null}
                  <Link className="btn btn-primary" to="/tickets/close">
                    Close ticket
                  </Link>
                </div>
              </div>

              <div className="facts">
                {(header.facts || []).map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <span className={f.bad ? 'strong-bad' : undefined}>{factDisplayValue(f)}</span>
                  </div>
                ))}
              </div>
            </section>

            {showReclass ? (
              <div className="reclass">
                <div>
                  <b>The issue changed after inspection.</b> Reported as <b>{reportedLabel}</b>
                  <span className="arrow">→</span>
                  found to be <b>{foundLabel}</b>.
                </div>
              </div>
            ) : null}

            <div className="grid-2">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Work history</h3>
                    <p>Every visit and update on this ticket, oldest first — newest at the bottom</p>
                  </div>
                </div>

                <div className="panel-body">
                  <div className="tl">
                    {!workHistory.length ? <p className="muted">No updates yet.</p> : null}
                    {workHistory.map((item) => (
                      <div
                        key={`${item.when}-${item.title}`}
                        className={`tl-item${item.tone ? ` ${item.tone}` : ''}`}
                      >
                        <div className="when">{formatRaisedOn(item.when)}</div>
                        <h4>
                          {item.title}
                          {item.status ? (
                            <span className={`log-status ${item.statusClass}`}>{item.status}</span>
                          ) : null}
                        </h4>
                        {item.body ? <p>{item.body}</p> : null}
                        {!item.isAssignmentEvent || item.photos?.length ? (
                          <p className="tl-trail-actions">
                            {!item.isAssignmentEvent ? (
                              <button
                                type="button"
                                className="linkish"
                                onClick={() => setViewingUpdate(item)}
                              >
                                View Update
                              </button>
                            ) : null}
                            {item.photos?.length ? (
                              <button
                                type="button"
                                className="linkish"
                                onClick={() => setPreviewImages(item.photos)}
                              >
                                View Image
                              </button>
                            ) : null}
                          </p>
                        ) : null}
                        {item.meta ? (
                          <div className="tl-meta">
                            {item.meta.map((m, i) => (
                              <TimelineMeta key={i} item={m} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="foot-note">
                  A visit that fixes nothing is still recorded. Three visits with no repair is what
                  tells you a spare-parts problem, not a technician problem.
                </div>
              </section>

              <div>
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Issue classification</h3>
                      <p>What was reported against what was found</p>
                    </div>
                  </div>
                  <div className="class-pair">
                    <div>
                      <small>As reported</small>
                      <IssueClassificationList issues={reportedIssues} />
                    </div>
                    <div>
                      <small>As found</small>
                      <IssueClassificationList
                        issues={foundIssues}
                        emptyBig="Not inspected yet"
                        emptySub="—"
                      />
                    </div>
                  </div>
                  <div className="foot-note">
                    Reports and analytics use the found category, never the reported one.
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Assignment trail</h3>
                      <p>Who has held this ticket, in order</p>
                    </div>
                    <div className="actions">
                      {canReassign ? (
                        <Button size="sm" onClick={openAssignForm}>
                          Reassign
                        </Button>
                      ) : null}
                      {canFirstAssign ? (
                        <Button size="sm" variant="primary" onClick={openAssignForm}>
                          Assign
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="panel-body">
                    <div className="tl">
                      {!assignmentTrail.length ? (
                        <p className="muted">No assignment history.</p>
                      ) : null}
                      {assignmentTrail.map((item) => (
                        <div key={`${item.when}-${item.title}`} className="tl-item">
                          <div className="when">{formatRaisedOn(item.when)}</div>
                          <h4>{item.title}</h4>
                          {item.body ? <p>{item.body}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>This device before today</h3>
                      <p>
                        Slot Id {header.deviceId}, {header.road}, Slot {header.slot}
                      </p>
                    </div>
                    <Link className="link" to={`/devices/${header.deviceId}`}>
                      Full history
                    </Link>
                  </div>
                  <div className="panel-body flush">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Issue found</th>
                            <th className="num">Days</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!devicePreviousTickets.length ? (
                            <tr>
                              <td colSpan={3}>
                                <span className="muted">No earlier tickets on this slot.</span>
                              </td>
                            </tr>
                          ) : null}
                          {devicePreviousTickets.map((t) => (
                            <tr key={t.id}>
                              <td>
                                <Link className="code" to={`/tickets/${t.id}`}>
                                  {t.id}
                                </Link>
                              </td>
                              <td>{t.issue}</td>
                              <td className="num">{t.days}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <Modal
        open={updOpen}
        title="Add update"
        subtitle="Record a visit or progress note on this ticket"
        onClose={() => {
          setUpdOpen(false)
        }}
        wide
      >
        {updOpen && ticketId ? (
          <TicketAddUpdateForm
            ticketId={ticketId}
            user={user}
            pickVisitedBy={pickVisitedBy}
            photoPickerKey="upd-photos-open"
            canSubmit={showAddUpdate}
            onCancel={() => setUpdOpen(false)}
            onSuccess={async () => {
              setUpdOpen(false)
              await reloadTicket()
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={assignOpen && canManageAssign}
        title={isAssigned ? 'Reassign ticket' : 'Assign ticket'}
        subtitle={
          isAssigned
            ? 'Hand this ticket to another worker'
            : 'Choose who should hold this ticket'
        }
        onClose={closeAssignForm}
        closeDisabled={assignSaving}
        wide
      >
        {assignOpen && canManageAssign ? (
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
                {assignSaving ? 'Loading…' : isAssigned ? 'Reassign' : 'Assign'}
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

      <Modal
        open={Boolean(viewingUpdate)}
        title="View update"
        subtitle="Update details only — photos open from View Image"
        onClose={() => setViewingUpdate(null)}
      >
        <ViewUpdateDetails
          item={viewingUpdate}
          reportedIssues={reportedIssues}
          foundIssues={foundIssues}
        />
      </Modal>

      <ImagePreviewModal
        key={previewImages ? previewImages.join('|') : 'closed'}
        open={Boolean(previewImages?.length)}
        images={previewImages || []}
        onClose={() => setPreviewImages(null)}
        title="Ticket photos"
      />
    </>
  )
}
