import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { PART_MASTER } from '../../data/partMaster'
import { TEAM } from '../../data/team'
import {
  assignmentTrail,
  devicePreviousTickets,
  ticketHeader,
  workHistory,
} from '../../data/ticketDetail'
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
  if (item.kind === 'changedFrom') {
    return (
      <span>
        Changed from <b>{item.text}</b>
      </span>
    )
  }
  if (item.kind === 'changedTo') {
    return (
      <span>
        Changed to <b>{item.text}</b>
      </span>
    )
  }
  if (item.kind === 'reportedAs') {
    return (
      <span>
        Reported as <b>{item.text}</b>
      </span>
    )
  }
  return <span>{item.text}</span>
}

export default function TicketDetail() {
  const [updOpen, setUpdOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [updType, setUpdType] = useState('Site visit — not resolved')
  const [updCat, setUpdCat] = useState('')
  const [updSub, setUpdSub] = useState('')
  const [handover, setHandover] = useState(TEAM[0])

  const resolved = updType.includes('resolved')

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> ›{' '}
        <Link to={`/devices/${ticketHeader.deviceId}`}>{ticketHeader.deviceId}</Link> ›{' '}
        {ticketHeader.road}, Slot {ticketHeader.slot}
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <>
        <Link className="btn" to="/tickets">
          Back to list
        </Link>
        <Link className="btn" to={`/devices/${ticketHeader.deviceId}`}>
          Device history
        </Link>
        <Link className="btn" to="/tickets/update">
          Update on site
        </Link>
        <Link className="btn btn-primary" to="/tickets/close">
          Close ticket
        </Link>
      </>
    ),
    [],
  )

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

  return (
    <>
      <PageMeta pageId="ticket-detail" title={ticketHeader.id} crumb={crumb} actions={actions} />

      <main className="page">
        <section className="record">
          <div className="record-top">
            <div>
              <h3>{ticketHeader.id}</h3>
              <div className="sub">
                Device{' '}
                <Link className="code" to={`/devices/${ticketHeader.deviceId}`}>
                  {ticketHeader.deviceId}
                </Link>{' '}
                · <Link to="/devices">{ticketHeader.road}</Link> · Slot <b>{ticketHeader.slot}</b>
              </div>
            </div>
            <div style={{ marginLeft: 20 }}>
              <Pill tone={ticketHeader.statusTone}>{ticketHeader.status}</Pill>
            </div>
            <div className="push">
              <Button onClick={() => toast('Ticket reassigned.')}>Reassign</Button>
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
            {ticketHeader.facts.map((f) => (
              <div key={f.label}>
                <small>{f.label}</small>
                <span className={f.bad ? 'strong-bad' : undefined}>
                  {f.value}
                  {f.extra ? <em className="muted"> {f.extra}</em> : null}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="reclass">
          <div>
            <b>The issue changed after inspection.</b> Reported as{' '}
            <b>Electrical › Controller board failure</b>
            <span className="arrow">→</span>
            found to be <b>Mechanical › Motor failure</b> on 25 Aug by Ramesh Vaghela.
          </div>
        </div>

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
                    <select defaultValue="Ramesh Vaghela">
                      <option>Ramesh Vaghela</option>
                      <option>Jignesh Solanki</option>
                      <option>Mahesh Thakor</option>
                    </select>
                  </Field>
                  <Field label="Date and time">
                    <input type="date" defaultValue="2026-09-01" />
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
                    The ticket closes only when the update type is <b>resolved</b>. Everything else
                    keeps it open.
                  </span>
                </div>
              </form>
            </div>

            <div className="panel-body">
              <div className="tl">
                {workHistory.map((item) => (
                  <div key={item.when} className={`tl-item${item.tone ? ` ${item.tone}` : ''}`}>
                    <div className="when">{item.when}</div>
                    <h4>
                      {item.title}
                      <span className={`log-status ${item.statusClass}`}>{item.status}</span>
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
                  <small>As reported on 24 Aug</small>
                  <div className="big">Controller board failure</div>
                  <div className="sub2">Electrical</div>
                  <div className="sub2 muted" style={{ marginTop: 8 }}>
                    By Nilesh Chauhan, site attendant
                  </div>
                </div>
                <div>
                  <small>As found on 25 Aug</small>
                  <div className="big">Motor failure</div>
                  <div className="sub2">
                    Mechanical · <Pill tone="bad">Critical</Pill>
                  </div>
                  <div className="sub2 muted" style={{ marginTop: 8 }}>
                    By Ramesh Vaghela, technician
                  </div>
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
                      <TeamSelect value={handover} onChange={(e) => setHandover(e.target.value)} />
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
                  {assignmentTrail.map((item) => (
                    <div key={item.when} className={`tl-item${item.tone ? ` ${item.tone}` : ''}`}>
                      <div className="when">{item.when}</div>
                      <h4>
                        {item.title}
                        {item.status ? (
                          <span className={`log-status ${item.statusClass}`}>{item.status}</span>
                        ) : null}
                      </h4>
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
                    {ticketHeader.deviceId}, {ticketHeader.road}, Slot {ticketHeader.slot}
                  </p>
                </div>
                <Link className="link" to={`/devices/${ticketHeader.deviceId}`}>
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
              <div className="foot-note">6th ticket on this device in five months.</div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
