import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { ApiRequestError } from '../../services/api'
import { getTicket } from '../../services/tickets'
import { canPerm, homePathForUser } from '../../services/users'
import { TicketAddUpdateForm } from '../../components/tickets/TicketAddUpdateForm'
import { groupIssuesForDisplay } from '../../components/tickets/ticketIssueRowsHelpers'
import { Button } from '../../components/ui/Button'
import { ImagePreviewModal } from '../../components/ui/ImagePreviewModal'
import { Modal } from '../../components/ui/Modal'
import { Pill } from '../../components/ui/Pill'
import { TicketDetailSkeleton } from '../../components/ui/Skeleton'

function IssueClassificationList({ issues, emptyBig = '—', emptySub = '—' }) {
  const groups = groupIssuesForDisplay(issues)
  if (!groups.length) {
    return (
      <div className="issue-empty">
        <strong>{emptyBig}</strong>
        {emptySub && emptySub !== '—' ? <span>{emptySub}</span> : null}
      </div>
    )
  }
  return (
    <div className="issue-groups">
      {groups.map((g) => {
        const tracked = g.subs.filter((s) => s.status)
        const resolved = tracked.filter((s) => s.status === 'Resolved').length
        return (
          <div key={g.key} className="issue-group">
            <div className="issue-group-head">
              <span className="issue-group-name">{g.category}</span>
              {tracked.length ? (
                <span
                  className={`issue-group-count${resolved === tracked.length ? ' done' : ''}`}
                >
                  {resolved}/{tracked.length} resolved
                </span>
              ) : null}
            </div>
            <ul className="issue-list">
              {g.subs.map((s) => (
                <li
                  key={s.key}
                  className={`issue-row${s.status === 'Resolved' ? ' is-resolved' : ''}`}
                >
                  <span className="issue-row-label">{s.label}</span>
                  {s.status ? (
                    <Pill tone={s.status === 'Resolved' ? 'ok' : 'bad'}>{s.status}</Pill>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
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
  return `${dd}/${mm}/${yyyy} at ${hh}:${minutes}\u00a0${ampm}`
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

/** Issues this update marked as fixed, grouped by main issue. */
function ViewUpdateResolvedIssues({ issues }) {
  const groups = groupIssuesForDisplay(normalizeViewUpdateIssues(issues))
  if (!groups.length) return null
  const count = groups.reduce((total, group) => total + group.subs.length, 0)

  return (
    <div className="view-update-resolved">
      <div className="view-update-resolved-head">
        <span className="view-update-resolved-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <small>Fixed in this update</small>
          <strong>
            {count} {count === 1 ? 'issue' : 'issues'} resolved
          </strong>
        </div>
      </div>
      <ul className="view-update-resolved-list">
        {groups.map((group) => (
          <li key={group.key}>
            <span className="view-update-resolved-main">{group.category}</span>
            <div className="view-update-sub-list">
              {group.subs.map((sub) => (
                <span className="view-update-resolved-sub" key={sub.key}>
                  ✓ {sub.label}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
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
          <small>Ticket status</small>
          <span>{item.status}</span>
        </div>
      ) : null}
      <ViewUpdateIssueList item={item} reportedIssues={reportedIssues} foundIssues={foundIssues} />
      {item.resolvedIssues?.length ? <ViewUpdateResolvedIssues issues={item.resolvedIssues} /> : null}
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
      resolvedIssues: Array.isArray(e.resolvedIssues) ? e.resolvedIssues : [],
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
  const canUpdateTicketView = canPerm(user, 'Update ticket', 'v')
  const canUpdateTicketEdit = canPerm(user, 'Update ticket', 'e')
  const backToTickets = ticketsListReturnPath(location.state?.from)

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [updOpen, setUpdOpen] = useState(false)
  // 'update' = Add update, 'resolve' = same form with the resolved update type preset.
  const [updMode, setUpdMode] = useState('update')
  const [previewImages, setPreviewImages] = useState(null)
  const [viewingUpdate, setViewingUpdate] = useState(null)

  function openAddUpdateModal(mode = 'update') {
    setUpdMode(mode)
    setUpdOpen(true)
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
  const devicePreviousTickets = ticket?.devicePreviousTickets || []
  // Tickets have no holder: anyone with Update ticket `v` + `e` may update any open ticket.
  const showAddUpdate =
    canUpdateTicketView && canUpdateTicketEdit && Boolean(header) && header.status !== 'Closed'
  // Closing needs Update ticket `x`.
  const canCloseTicket = canPerm(user, 'Update ticket', 'x') && header?.status !== 'Closed'

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

  const reportedLabel = reportedIssues
    .map((i) => [i.category, i.sub].filter(Boolean).join(' › '))
    .filter(Boolean)
    .join('; ')
  const foundLabel = foundIssues
    .map((i) => [i.category, i.sub].filter(Boolean).join(' › '))
    .filter(Boolean)
    .join('; ')
  const showReclass = Boolean(reportedLabel && foundLabel && reportedLabel !== foundLabel)

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

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
            <div className="record-head">
              <div className="record-title">
                <h3>{header.id}</h3>
                <Pill tone={header.statusTone}>{header.status}</Pill>
              </div>
              <div className="sub">
                    Slot Id{' '}
                    <Link className="code" to={`/devices/${header.deviceId}`}>
                      {header.deviceId}
                </Link>{' '}
                    · <Link to="/devices">{header.road}</Link> ·{' '}
                    <span className="sub-part">
                      Slot <b>{header.slot}</b>
                    </span>
              </div>
            </div>
            <div className="push">
                  {showAddUpdate ? (
                    <>
                      <Button onClick={() => openAddUpdateModal('update')}>Add update</Button>
                      <Button onClick={() => openAddUpdateModal('resolve')}>Resolve</Button>
                    </>
                  ) : null}
                  {canCloseTicket ? (
                    <Link
                      className="btn btn-primary"
                      to={`/tickets/close?ticketId=${encodeURIComponent(header.id)}`}
                    >
                Close ticket
              </Link>
                  ) : null}
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

        <div className="grid-2 ticket-detail-grid">
          <section className="panel ticket-detail-history">
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

          <div className="ticket-detail-side">
            <section className="panel ticket-detail-class">
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
                        emptySub="Shows here once a technician records what was found on site."
                      />
                </div>
              </div>
              <div className="foot-note">
                Reports and analytics use the found category, never the reported one.
              </div>
            </section>

            <section className="panel ticket-detail-device">
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
        title={updMode === 'resolve' ? 'Resolve ticket' : 'Add update'}
        subtitle={
          updMode === 'resolve'
            ? 'Record the fix on this ticket'
            : 'Record a visit or progress note on this ticket'
        }
        onClose={() => {
          setUpdOpen(false)
        }}
        wide
      >
        {updOpen && ticketId ? (
          <TicketAddUpdateForm
            key={updMode}
            ticketId={ticketId}
            user={user}
            photoPickerKey="upd-photos-open"
            canSubmit={showAddUpdate}
            canClose={canPerm(user, 'Update ticket', 'x')}
            reportedIssues={issuesReported || []}
            initialUpdateType={updMode === 'resolve' ? 'Site visit — resolved' : undefined}
            onCancel={() => setUpdOpen(false)}
            onConflict={async () => {
              setUpdOpen(false)
              await reloadTicket()
            }}
            onSuccess={async () => {
              setUpdOpen(false)
              await reloadTicket()
            }}
          />
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
