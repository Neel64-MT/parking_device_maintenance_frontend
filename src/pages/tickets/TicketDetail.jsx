import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { TEAM } from '../../data/team'
import { ApiRequestError } from '../../services/api'
import { listParts, sumSelectedPartsAmount } from '../../services/parts'
import { getTicket, addTicketUpdate, attachTicketUpdatePhotos } from '../../services/tickets'
import { uploadImages } from '../../services/uploads'
import { canPerm, isDashboardRole } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { ImagePreviewModal } from '../../components/ui/ImagePreviewModal'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { Modal } from '../../components/ui/Modal'
import { PartChips } from '../../components/ui/PartChips'
import { PhotoPicker } from '../../components/ui/PhotoPicker'
import { Pill } from '../../components/ui/Pill'
import { TicketDetailSkeleton } from '../../components/ui/Skeleton'
import { TeamSelect } from '../../components/ui/TeamSelect'

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
    return {
      when: e.when,
      title: e.title || e.actor || 'Update',
      body: e.body || '',
      status: e.status || '',
      statusClass: closed ? 'ok' : 'warn',
      tone: closed ? 'ok' : undefined,
      meta: meta.length ? meta : null,
      photos: normalizePhotos(e.photos),
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
  const canAddUpdate = canPerm(user, 'Update ticket', 'e')
  const pickVisitedBy = isDashboardRole(user)
  const backToTickets = ticketsListReturnPath(location.state?.from)

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [updOpen, setUpdOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(() => Boolean(location.state?.openAssign))
  const [updType, setUpdType] = useState('Site visit — not resolved')
  const [updCat, setUpdCat] = useState('')
  const [updSub, setUpdSub] = useState('')
  const [handover, setHandover] = useState(TEAM[0])
  const [previewImages, setPreviewImages] = useState(null)
  const [updPhotos, setUpdPhotos] = useState([])
  const [updWorkDone, setUpdWorkDone] = useState('')
  const [updCost, setUpdCost] = useState('')
  const [updPartIds, setUpdPartIds] = useState([])
  const [updVisitedBy, setUpdVisitedBy] = useState(() => (isDashboardRole(user) ? '' : user?.name || ''))
  const [updSubmitting, setUpdSubmitting] = useState(false)
  const [partsItems, setPartsItems] = useState([])
  const [partsLoading, setPartsLoading] = useState(false)
  const [partsError, setPartsError] = useState('')

  function resetUpdateForm() {
    setUpdType('Site visit — not resolved')
    setUpdCat('')
    setUpdSub('')
    setUpdPhotos([])
    setUpdWorkDone('')
    setUpdCost('')
    setUpdPartIds([])
    setUpdVisitedBy(pickVisitedBy ? '' : user?.name || '')
  }

  useEffect(() => {
    if (!updOpen) return undefined
    let cancelled = false
    listParts()
      .then((list) => {
        if (!cancelled) {
          setPartsItems(list)
          setPartsError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPartsItems([])
          setPartsError(err instanceof ApiRequestError ? err.message : 'Could not load parts.')
        }
      })
      .finally(() => {
        if (!cancelled) setPartsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [updOpen])

  const partsHintTotal = sumSelectedPartsAmount(partsItems, updPartIds)
  const labourHint = updCost === '' ? 0 : Number(updCost) || 0
  const visitHintTotal = partsHintTotal + labourHint

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
  const workHistory = useMemo(() => mapWorkHistory(ticket?.workHistory), [ticket])
  const assignmentTrail = ticket?.assignmentTrail || []
  const devicePreviousTickets = ticket?.devicePreviousTickets || []
  const assignedTo =
    (header?.facts || []).find((f) => f.label === 'Assigned to')?.value || ''
  const isAssigned = Boolean(assignedTo && assignedTo !== 'Not assigned')
  const canManageAssign = canAssign && header && header.status !== 'Closed'
  const canReassign = canManageAssign && isAssigned
  const canFirstAssign = canManageAssign && !isAssigned

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

  async function submitUpdate(e) {
    e.preventDefault()
    if (!ticketId) return
    if (!canAddUpdate) {
      toast('You do not have permission to add ticket updates.')
      return
    }
    if (pickVisitedBy && !updVisitedBy.trim()) {
      toast('Select who visited.')
      return
    }
    setUpdSubmitting(true)
    try {
      // 1) Persist update first — if this fails (e.g. 403), do not upload.
      const saved = await addTicketUpdate(ticketId, {
        updateType: updType,
        workDone: updWorkDone.trim() || undefined,
        cost: updCost === '' ? 0 : Number(updCost) || 0,
        parts: [...new Set(updPartIds)],
        photos: [],
      })

      // 2) Upload only after update succeeds; 3) attach URLs so overall success needs both.
      if (updPhotos.length) {
        if (!saved?.eventId) {
          throw new ApiRequestError('Update saved but server did not return an event id for photos.', {
            status: 500,
          })
        }
        const uploaded = await uploadImages(updPhotos)
        const photoUrls = uploaded.map((u) => u.url).filter(Boolean)
        if (!photoUrls.length) {
          throw new ApiRequestError('Update saved but photo upload returned no URLs.', {
            status: 500,
          })
        }
        await attachTicketUpdatePhotos(ticketId, saved.eventId, photoUrls)
      }

      await reloadTicket()
      resetUpdateForm()
      setUpdOpen(false)
      const visitCost = saved?.cost != null ? Number(saved.cost) : null
      if (visitCost != null && !Number.isNaN(visitCost)) {
        toast(`Update saved. Visit cost ₹${visitCost.toLocaleString('en-IN')}.`)
      } else {
        toast('Update saved.')
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not save update.')
    } finally {
      setUpdSubmitting(false)
    }
  }

  function submitAssign(e) {
    e.preventDefault()
    setAssignOpen(false)
    toast('Design preview — this form is not connected yet.')
  }

  const reportedLabel = classification?.reported
    ? [classification.reported.category, classification.reported.sub].filter(Boolean).join(' › ')
    : null
  const foundLabel = classification?.found
    ? [classification.found.category, classification.found.sub].filter(Boolean).join(' › ')
    : null
  const showReclass = reportedLabel && foundLabel && reportedLabel !== foundLabel

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
                    Device{' '}
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
                  {canAddUpdate ? (
                    <Button
                      onClick={() => {
                        resetUpdateForm()
                        setPartsLoading(true)
                        setPartsError('')
                        setUpdOpen(true)
                      }}
                    >
                      Add update
                    </Button>
                  ) : null}
                  {canReassign ? (
                    <Button onClick={() => setAssignOpen(true)}>Reassign</Button>
                  ) : null}
                  {canFirstAssign ? (
                    <Button variant="primary" onClick={() => setAssignOpen(true)}>
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
                        <div className="when">{item.when}</div>
                        <h4>
                          {item.title}
                          {item.status ? (
                            <span className={`log-status ${item.statusClass}`}>{item.status}</span>
                          ) : null}
                        </h4>
                        {item.body ? <p>{item.body}</p> : null}
                        {item.photos?.length ? (
                          <p className="tl-view-image">
                            <button
                              type="button"
                              className="linkish"
                              onClick={() => setPreviewImages(item.photos)}
                            >
                              View Image
                            </button>
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
                      <div className="big">{classification?.reported?.sub || '—'}</div>
                      <div className="sub2">{classification?.reported?.category || '—'}</div>
                    </div>
                    <div>
                      <small>As found</small>
                      <div className="big">{classification?.found?.sub || 'Not inspected yet'}</div>
                      <div className="sub2">{classification?.found?.category || '—'}</div>
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
                        <Button size="sm" onClick={() => setAssignOpen((o) => !o)}>
                          Reassign
                        </Button>
                      ) : null}
                      {canFirstAssign ? (
                        <Button size="sm" variant="primary" onClick={() => setAssignOpen((o) => !o)}>
                          Assign
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className={`inline-form${assignOpen && canManageAssign ? ' open' : ''}`}>
                    {canManageAssign ? (
                    <form onSubmit={submitAssign}>
                      <div className="row">
                        <Field label="Hand to">
                          <TeamSelect value={handover} onChange={setHandover} />
                        </Field>
                        <Field label="Note">
                          <input type="text" placeholder="Optional note" />
                        </Field>
                      </div>
                      <div className="row" style={{ marginTop: 12 }}>
                        <Button type="submit" size="sm" variant="primary">
                          Save assignment
                        </Button>
                        <Button size="sm" onClick={() => setAssignOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                    ) : null}
                  </div>

                  <div className="panel-body">
                    <div className="tl">
                      {!assignmentTrail.length ? (
                        <p className="muted">No assignment history.</p>
                      ) : null}
                      {assignmentTrail.map((item) => (
                        <div key={`${item.when}-${item.title}`} className="tl-item">
                          <div className="when">{item.when}</div>
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
                        {header.deviceId}, {header.road}, Slot {header.slot}
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
                                <span className="muted">No earlier tickets on this device.</span>
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
          if (updSubmitting) return
          setUpdOpen(false)
          resetUpdateForm()
        }}
        closeDisabled={updSubmitting}
        wide
      >
        <form className="modal-update-form" onSubmit={submitUpdate}>
          <div className="row">
            <Field label="Update type">
              <select value={updType} onChange={(e) => setUpdType(e.target.value)}>
                <option>Site visit — not resolved</option>
                <option>Site visit — resolved</option>
                <option>Remote check</option>
                <option>Waiting for spare</option>
                <option>Waiting for traffic police / AMC</option>
              </select>
            </Field>
            <Field label="Visited by">
              {pickVisitedBy ? (
                <select
                  value={updVisitedBy}
                  onChange={(e) => setUpdVisitedBy(e.target.value)}
                  disabled={updSubmitting}
                  required
                >
                  <option value="">Select who visited</option>
                  {user?.name ? <option value={user.name}>{user.name}</option> : null}
                  {TEAM.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <select value={user?.name || ''} disabled>
                  <option value={user?.name || ''}>{user?.name || 'Current user'}</option>
                </select>
              )}
            </Field>
            <Field label="Date and time">
              <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </Field>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <IssueSelects
              category={updCat}
              subCategory={updSub}
              onCategoryChange={setUpdCat}
              onSubCategoryChange={setUpdSub}
              categoryLabel="Issue category found"
            />
            <Field
              label="Labour / other charges"
              hint="Part prices come from Parts and are added by the server."
            >
              <input
                type="number"
                placeholder="0"
                value={updCost}
                onChange={(e) => setUpdCost(e.target.value)}
                min="0"
                disabled={updSubmitting}
              />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field
              label="Parts changed"
              hint="Tap every part you replaced. Leave blank if nothing was changed."
            >
              <PartChips
                items={partsItems}
                selected={updPartIds}
                onChange={setUpdPartIds}
                loading={partsLoading}
                error={partsError}
                disabled={updSubmitting}
              />
              {updPartIds.length > 0 ? (
                <div className="parts-total" aria-live="polite">
                  <div className="parts-total-meta">
                    <strong>
                      Parts total · {updPartIds.length} selected
                    </strong>
                    <span>
                      From Parts (display only). Server adds this to labour
                      {labourHint > 0
                        ? ` · est. visit ₹${visitHintTotal.toLocaleString('en-IN')}`
                        : ''}
                      .
                    </span>
                  </div>
                  <div className="parts-total-amount">
                    ₹{partsHintTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              ) : null}
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Photos">
              <PhotoPicker
                key={updOpen ? 'upd-photos-open' : 'upd-photos-closed'}
                hint="Up to 5 photos — the work, the device, the site."
                onChange={setUpdPhotos}
                disabled={updSubmitting}
              />
            </Field>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <Field label="What was done today" className="span-2" style={{ flex: 3 }}>
              <textarea
                style={{ minHeight: 64 }}
                placeholder="Plain description of the work done on this visit, even if nothing was fixed."
                value={updWorkDone}
                onChange={(e) => setUpdWorkDone(e.target.value)}
              />
            </Field>
          </div>

          <p className="muted modal-update-hint">
            The ticket closes only when the update type is <b>resolved</b>. Everything else keeps it
            open.
          </p>

          <div className="modal-actions modal-update-actions">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setUpdOpen(false)
                resetUpdateForm()
              }}
              disabled={updSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" disabled={updSubmitting}>
              {updSubmitting ? 'Saving…' : 'Save update'}
            </Button>
          </div>
        </form>
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
