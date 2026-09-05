import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../context/ToastContext'
import { PART_MASTER } from '../../data/partMaster'
import { TEAM } from '../../data/team'
import { ApiRequestError } from '../../services/api'
import { getTicket } from '../../services/tickets'
import { canPerm } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { Pill } from '../../components/ui/Pill'
import { TeamSelect } from '../../components/ui/TeamSelect'

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

function mapWorkHistory(events) {
  return (events || []).map((e) => {
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
    }
  })
}

export default function TicketDetail() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const canView = canPerm(user, 'All tickets', 'v')

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [updOpen, setUpdOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [updType, setUpdType] = useState('Site visit — not resolved')
  const [updCat, setUpdCat] = useState('')
  const [updSub, setUpdSub] = useState('')
  const [handover, setHandover] = useState(TEAM[0])

  const resolved = updType.includes('resolved')

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

  const crumb = useMemo(() => {
    if (!header) return null
    return (
      <>
        <Link to="/tickets">Tickets</Link> ›{' '}
        <Link to={`/devices/${header.deviceId}`}>{header.deviceId}</Link> › {header.road}, Slot{' '}
        {header.slot}
      </>
    )
  }, [header])

  const actions = useMemo(() => {
    if (!header) return null
    return (
      <>
        <Link className="btn" to={`/devices/${header.deviceId}`}>
          Device history
        </Link>
        <Link className="btn" to="/tickets/update">
          Update on site
        </Link>
        <Link className="btn btn-primary" to="/tickets/close">
          Close ticket
        </Link>
      </>
    )
  }, [header])

  function submitUpdate(e) {
    e.preventDefault()
    setUpdOpen(false)
    toast('Design preview — this form is not connected yet.')
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
  const showReclass =
    reportedLabel && foundLabel && reportedLabel !== foundLabel

  return (
    <>
      <PageMeta
        pageId="ticket-detail"
        title={header?.id || ticketId || 'Ticket'}
        crumb={crumb}
        actions={actions}
      />

      <main className="page">
        <Link className="back-link" to="/tickets">
          ← Back to tickets
        </Link>

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? <p className="muted">Loading ticket…</p> : null}

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
                  <Button onClick={() => toast('Design preview — reassign is not connected yet.')}>
                    Reassign
                  </Button>
                  <Button
                    onClick={() => {
                      setUpdOpen((o) => !o)
                    }}
                  >
                    Add update
                  </Button>
                  <Link className="btn btn-primary" to="/tickets/close">
                    Close ticket
                  </Link>
                </div>
              </div>

              <div className="facts">
                {(header.facts || []).map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <span className={f.bad ? 'strong-bad' : undefined}>{f.value}</span>
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
                    <p>Every visit and update on this ticket, newest first</p>
                  </div>
                </div>

                <div className={`inline-form${updOpen ? ' open' : ''}`}>
                  <form onSubmit={submitUpdate}>
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
                        <select defaultValue={user?.name || ''}>
                          <option>{user?.name || 'Current user'}</option>
                        </select>
                      </Field>
                      <Field label="Date and time">
                        <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                      </Field>
                    </div>

                    <div className="row" style={{ marginTop: 12 }}>
                      <Field label="What was done today" className="span-2" style={{ flex: 3 }}>
                        <textarea
                          style={{ minHeight: 64 }}
                          placeholder="Plain description of the work done on this visit, even if nothing was fixed."
                        />
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
                      <Field label="Part replaced">
                        <select defaultValue="">
                          <option value="">No part replaced</option>
                          {PART_MASTER.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Cost added today" hint="Only what was spent on this visit.">
                        <input type="number" placeholder="0" />
                      </Field>
                    </div>
                    <div className="row" style={{ marginTop: 12 }}>
                      <Field label="Photo">
                        <input type="text" placeholder="Upload site photo" />
                      </Field>
                      <Field label="Next visit planned" style={{ opacity: resolved ? 0.4 : 1 }}>
                        <input type="date" />
                      </Field>
                    </div>

                    <div className="row" style={{ marginTop: 14 }}>
                      <Button type="submit" size="sm" variant="primary">
                        Save update
                      </Button>
                      <Button size="sm" onClick={() => setUpdOpen(false)}>
                        Cancel
                      </Button>
                      <span className="muted" style={{ marginLeft: 6 }}>
                        The ticket closes only when the update type is <b>resolved</b>. Everything
                        else keeps it open.
                      </span>
                    </div>
                  </form>
                </div>

                <div className="panel-body">
                  <div className="tl">
                    {!workHistory.length ? (
                      <p className="muted">No updates yet.</p>
                    ) : null}
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
                        <p>{item.body}</p>
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
                      <Button size="sm" onClick={() => setAssignOpen((o) => !o)}>
                        Reassign
                      </Button>
                    </div>
                  </div>

                  <div className={`inline-form${assignOpen ? ' open' : ''}`}>
                    <form onSubmit={submitAssign}>
                      <div className="row">
                        <Field label="Hand over to" style={{ flex: 2 }}>
                          <TeamSelect
                            value={handover}
                            onChange={(e) => setHandover(e.target.value)}
                          />
                        </Field>
                        <Field label="Reason" style={{ flex: 2 }}>
                          <input type="text" placeholder="e.g. needs a mechanical technician" />
                        </Field>
                      </div>
                      <div className="row" style={{ marginTop: 12 }}>
                        <Button type="submit" size="sm" variant="primary">
                          Hand over
                        </Button>
                        <Button size="sm" onClick={() => setAssignOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
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
                          <p>{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="foot-note">
                    Only the person holding the ticket can add an update or close it. Handing over
                    passes that right along.
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
    </>
  )
}
