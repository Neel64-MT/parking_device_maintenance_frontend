import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { getTicket } from '../../services/tickets'
import { TicketCloseForm } from '../../components/tickets/TicketCloseForm'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'

function factValue(facts, label) {
  const found = (facts || []).find((f) => f.label === label)
  return found ? found.value : ''
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TicketClose() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ticketId = (searchParams.get('ticketId') || '').trim()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(Boolean(ticketId))
  const [loadError, setLoadError] = useState(
    ticketId ? '' : 'No ticket selected. Open a ticket and use "Close ticket".',
  )
  const [formBusy, setFormBusy] = useState(false)

  useEffect(() => {
    if (!ticketId) return undefined
    let cancelled = false
    getTicket(ticketId)
      .then((data) => {
        if (cancelled) return
        setTicket(data)
        setLoadError('')
        if (data?.header?.status === 'Closed') {
          setLoadError('This ticket is already closed.')
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.message || 'Could not load this ticket.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ticketId])

  const header = ticket?.header
  const ticketRef = header?.id || ticketId
  const status = header?.status || ''

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link>
        {ticketRef ? (
          <>
            {' › '}
            <Link to={`/tickets/${encodeURIComponent(ticketRef)}`}>{ticketRef}</Link>
          </>
        ) : null}
        {' › Close'}
      </>
    ),
    [ticketRef],
  )

  const actions = useMemo(
    () =>
      ticketRef ? (
        <Link className="btn" to={`/tickets/${encodeURIComponent(ticketRef)}`}>
          Ticket history
        </Link>
      ) : null,
    [ticketRef],
  )

  function handleSuccess() {
    navigate(`/tickets/${encodeURIComponent(ticketRef)}`, { replace: true })
  }

  return (
    <>
      <PageMeta pageId="ticket-close" title="Close ticket" crumb={crumb} actions={actions} />

      <main className="page mobile">
        {loading ? <p className="muted">Loading ticket…</p> : null}

        {loadError && !loading ? (
          <section className="panel">
            <div className="panel-body">
              <p className="muted" style={{ marginTop: 0 }}>
                {loadError}
              </p>
              <Button variant="primary" onClick={() => navigate('/tickets')}>
                Back to tickets
              </Button>
            </div>
          </section>
        ) : null}

        {header && !loadError ? (
          <>
            <section className="panel">
              <div className="panel-body">
                <DeviceCard
                  id={ticketRef}
                  location={`${header.road || '—'} · Slot ${header.slot || '—'} · ${ticketRef}`}
                  facts={[
                    { label: 'Raised on', value: formatDate(factValue(header.facts, 'Raised on')) },
                    { label: 'Raised by', value: factValue(header.facts, 'Raised by') || '—' },
                    { label: 'Assigned to', value: factValue(header.facts, 'Assigned to') || '—' },
                    { label: 'Status', value: status },
                    { label: 'Cost so far', value: factValue(header.facts, 'Cost so far') || '₹0' },
                  ]}
                />
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="step-head">
                  <div className="step-n">1</div>
                  <div>
                    <h3>Final issue</h3>
                    <p>This is what the reports will count</p>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <TicketCloseForm
                  ticketId={ticketRef}
                  formId="ticket-close-form"
                  reportedIssues={ticket?.issuesReported || []}
                  hideActions
                  onBusyChange={setFormBusy}
                  onSuccess={handleSuccess}
                />
              </div>
            </section>

            <div className="sticky-bar">
              <div className="sticky-bar-inner">
                <Link className="btn" to={`/tickets/${encodeURIComponent(ticketRef)}`}>
                  Back
                </Link>
                <Button
                  variant="primary"
                  type="submit"
                  form="ticket-close-form"
                  disabled={formBusy}
                >
                  {formBusy ? 'Closing…' : 'Close ticket'}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </>
  )
}
