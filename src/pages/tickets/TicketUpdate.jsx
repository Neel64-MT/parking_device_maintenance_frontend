import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError } from '../../context/ToastContext'
import { openTicketIssueLabel, scanDeviceFacts, scanOpenTickets } from '../../data/scanDevice'
import { canScanWithCamera, resolveScan } from '../../services/devices'
import { getTicket } from '../../services/tickets'
import { canPerm } from '../../services/users'
import { TicketAddUpdateForm } from '../../components/tickets/TicketAddUpdateForm'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/FilterBar'
import { Pill } from '../../components/ui/Pill'
import { QrScannerModal } from '../../components/ui/QrScannerModal'

function ScanIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </svg>
  )
}

function applyScanToDevice(scan) {
  return {
    id: scan.deviceId,
    location: `${scan.parkingLocation || scan.locationSite} · Slot ${scan.slotLabel || scan.slot}`,
    scan,
  }
}

/**
 * Any open ticket can be updated by anyone with Update ticket `e` — tickets have no holder.
 * Only a Closed ticket is refused here; the backend stays the final authority.
 */
async function loadUpdatableTicket(ticketId) {
  const data = await getTicket(ticketId)
  const status = data?.header?.status
  if (!status || status === 'Closed') {
    return { ok: false, message: 'That ticket is closed and cannot be updated here.', data: null }
  }
  return { ok: true, data }
}

export default function TicketUpdate() {
  const { user } = useAuth()
  const canScan = canScanWithCamera(user)
  const canSubmitUpdate = canPerm(user, 'Update ticket', 'e')
  const canCloseTicket = canPerm(user, 'Update ticket', 'x')
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resolveGen = useRef(0)
  const entryHandled = useRef(false)
  const gatingRef = useRef(false)

  const queryTicketId = (searchParams.get('ticketId') || '').trim()
  const stateTicketId =
    typeof location.state?.ticketId === 'string' ? location.state.ticketId.trim() : ''
  const entryTicketId = queryTicketId || stateTicketId
  const entryQr = typeof location.state?.qr === 'string' ? location.state.qr.trim() : ''

  const [qrInput, setQrInput] = useState(() => entryQr)
  const [device, setDevice] = useState(null)
  const [lookupState, setLookupState] = useState('idle') // idle | hit | miss | error
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [gating, setGating] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)
  const [formBusy, setFormBusy] = useState(false)

  const fromHere = `${location.pathname}${location.search}`

  const backTo =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('/tickets/update')
      ? location.state.from
      : '/tickets'

  const crumb = useMemo(
    () => (
      <>
        <Link to={backTo}>Tickets</Link> › Update ticket
      </>
    ),
    [backTo],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to={backTo}>
        All tickets
      </Link>
    ),
    [backTo],
  )

  function clearResult() {
    setDevice(null)
    setLookupState('idle')
  }

  function syncTicketQuery(ticketId) {
    const params = new URLSearchParams(location.search)
    if (ticketId) params.set('ticketId', ticketId)
    else params.delete('ticketId')
    const qs = params.toString()
    navigate(
      { pathname: '/tickets/update', search: qs ? `?${qs}` : '' },
      { replace: true, state: { ...(location.state || {}), ticketId, from: location.state?.from || backTo } },
    )
  }

  async function activateTicket(ticketId) {
    if (!user?.id || gatingRef.current) return
    gatingRef.current = true
    setGating(true)
    try {
      const result = await loadUpdatableTicket(ticketId)
      if (!result.ok) {
        toast(result.message, 'error')
        setActiveTicket(null)
        return
      }
      setActiveTicket(result.data)
      syncTicketQuery(ticketId)
    } catch (err) {
      toastApiError(err, 'Could not open that ticket for update.')
      setActiveTicket(null)
    } finally {
      gatingRef.current = false
      setGating(false)
    }
  }

  async function applyResolved(raw) {
    const gen = ++resolveGen.current
    clearResult()
    setActiveTicket(null)
    setResolving(true)
    try {
      const scan = await resolveScan(raw)
      if (gen !== resolveGen.current) return
      if (!scan) {
        setLookupState('miss')
        toast('No device matches that code.', 'error')
        return
      }
      setQrInput(scan.qrNumber || scan.qr || String(raw || '').trim())
      setDevice(applyScanToDevice(scan))
      setLookupState('hit')
      // One open ticket — show the form without a second click.
      // Several (different issues) — the user picks which one to update.
      const open = scanOpenTickets(scan)
      if (open.length === 1) {
        if (gen === resolveGen.current) setResolving(false)
        await activateTicket(open[0].id)
      }
    } catch (err) {
      if (gen !== resolveGen.current) return
      clearResult()
      setLookupState('error')
      toastApiError(err, 'Could not look up that device.')
    } finally {
      if (gen === resolveGen.current) setResolving(false)
    }
  }

  function findByQr() {
    const code = qrInput.trim()
    if (!code) {
      toast('Enter a QR number.', 'error')
      return
    }
    applyResolved(code)
  }

  function onQrScan(text) {
    applyResolved(text)
  }

  function openTicketPath(ticketId) {
    return `/tickets/${encodeURIComponent(ticketId)}`
  }

  function clearActiveTicket() {
    setActiveTicket(null)
    syncTicketQuery('')
  }

  // Entry: ?ticketId= / state.ticketId / state.qr
  useEffect(() => {
    if (entryHandled.current) return
    if (!entryTicketId && !entryQr) return
    entryHandled.current = true

    // Defer so the effect does not synchronously cascade setState (react-hooks/set-state-in-effect).
    const id = window.setTimeout(() => {
      if (entryTicketId) {
        if (entryQr) setQrInput(entryQr)
        void activateTicket(entryTicketId)
        return
      }
      if (entryQr) void applyResolved(entryQr)
    }, 0)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for entry navigation
  }, [])

  const openTickets = scanOpenTickets(device?.scan)
  const singleOpenId = openTickets.length === 1 ? openTickets[0].id : null
  const busy = resolving || gating
  const raiseQr = qrInput.trim() || device?.scan?.qrNumber || device?.scan?.qr || ''
  const header = activeTicket?.header
  const formReady = Boolean(activeTicket?.header?.id)

  return (
    <>
      <PageMeta pageId="ticket-update" title="Update ticket" crumb={crumb} actions={actions} />

      <main className="page mobile">
        {!formReady ? (
          <section className="panel">
            <div className="panel-head">
              <div className="step-head">
                <div className="step-n">1</div>
                <div>
                  <h3>Which device</h3>
                  <p>Scan the sticker or type the QR number</p>
                </div>
              </div>
            </div>
            <div className="panel-body">
              {canScan ? (
                <button
                  type="button"
                  className="scan-btn"
                  onClick={() => setScannerOpen(true)}
                  disabled={busy}
                >
                  <ScanIcon />
                  Scan QR on the machine
                </button>
              ) : null}

              <div className="or">or type the QR number</div>

              <Field label="QR Number">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="e.g. AMCC2346"
                  disabled={busy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      findByQr()
                    }
                  }}
                />
              </Field>
              <div style={{ marginBottom: 0 }}>
                <Button variant="dark" onClick={findByQr} disabled={busy}>
                  {resolving ? 'Fetching device…' : gating ? 'Opening ticket…' : 'Find device'}
                </Button>
              </div>

              {resolving || gating ? (
                <p className="muted" style={{ marginTop: 12 }}>
                  {gating ? 'Opening ticket…' : 'Fetching device…'}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {formReady && header ? (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>{header.id}</h3>
                  <p>
                    Slot Id {header.deviceId}
                    {header.road ? ` · ${header.road}` : ''}
                    {header.slot ? `, Slot ${header.slot}` : ''}
                  </p>
                </div>
                <div className="actions">
                  <Pill tone={header.statusTone}>{header.status}</Pill>
                  <Button size="sm" onClick={clearActiveTicket} disabled={busy}>
                    Change device
                  </Button>
                  <Link className="btn btn-sm" to={openTicketPath(header.id)} state={{ from: fromHere }}>
                    Full history
                  </Link>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Add update</h3>
                  <p>Record a visit or progress note on this ticket</p>
                </div>
              </div>
              <div className="panel-body">
                <TicketAddUpdateForm
                  key={header.id}
                  ticketId={header.id}
                  user={user}
                  formClassName="modal-update-form"
                  formId="ticket-update-page-form"
                  photoPickerKey={`upd-page-${header.id}`}
                  hideActions
                  canSubmit={canSubmitUpdate}
                  canClose={canCloseTicket}
                  reportedIssues={activeTicket.issuesReported || []}
                  onBusyChange={setFormBusy}
                  onConflict={() => {
                    void activateTicket(header.id)
                  }}
                  onSuccess={() => {
                    navigate(backTo)
                  }}
                />
              </div>
            </section>
          </>
        ) : null}

        {!formReady && lookupState === 'hit' && device?.scan && !resolving ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>
                  {openTickets.length > 1
                    ? 'Open tickets on this device'
                    : singleOpenId
                      ? 'Open ticket on this device'
                      : 'Device found'}
                </h3>
                <p>
                  {openTickets.length > 1
                    ? `${openTickets.length} open tickets for different issues — pick the one to update`
                    : singleOpenId
                      ? `${singleOpenId}${openTickets[0].age ? ` · raised ${openTickets[0].age} ago` : ''}`
                      : 'There is no open ticket to update on this machine'}
                </p>
              </div>
              {singleOpenId ? (
                <Link className="link" to={openTicketPath(singleOpenId)} state={{ from: fromHere }}>
                  Full history
                </Link>
              ) : null}
            </div>
            <div className="panel-body">
              <DeviceCard
                id={device.id}
                location={device.location}
                facts={scanDeviceFacts(device.scan)}
              />
              {openTickets.length ? (
                <div className="reclass" style={{ display: '', marginTop: 12 }}>
                  <div>
                    <b>
                      {openTickets.length > 1
                        ? 'Update the ticket that matches the problem.'
                        : 'Update this ticket instead of raising another.'}
                    </b>
                    {openTickets.map((t) => (
                      <div key={t.id} style={{ marginTop: 10 }}>
                        <div>
                          <b>{t.id}</b>
                          {t.age ? ` · raised ${t.age} ago` : ''} · Open issues:{' '}
                          {openTicketIssueLabel(t)}
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={gating}
                            onClick={() => activateTicket(t.id)}
                          >
                            {gating ? 'Opening…' : 'Update this ticket'}
                          </Button>
                          <Link
                            className="btn btn-sm"
                            to={openTicketPath(t.id)}
                            state={{ from: fromHere }}
                          >
                            Open {t.id}
                          </Link>
                        </div>
                      </div>
                    ))}
                    <div
                      style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
                    >
                      <span>Different problem?</span>
                      <Link className="btn btn-sm" to="/tickets/raise" state={{ from: fromHere, qr: raiseQr }}>
                        Raise a ticket for a different issue
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="reclass" style={{ display: '', marginTop: 12 }}>
                  <div>
                    <b>No open ticket on this device.</b> Raise a new ticket if the machine needs
                    attention.
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        className="btn btn-sm btn-primary"
                        to="/tickets/raise"
                        state={{ from: fromHere, qr: raiseQr }}
                      >
                        Raise a ticket
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {!formReady && lookupState === 'miss' && !resolving ? (
          <section className="panel">
            <EmptyState
              title="No device matches that code"
              action={
                canScan ? (
                  <Button variant="dark" onClick={() => setScannerOpen(true)}>
                    Scan again
                  </Button>
                ) : (
                  <Link className="btn" to="/devices">
                    Search device list
                  </Link>
                )
              }
            >
              Check the sticker or QR number. The code must exist in the device list.
            </EmptyState>
          </section>
        ) : null}

        {!formReady && lookupState === 'error' && !resolving ? (
          <section className="panel">
            <EmptyState
              title="Could not check this device"
              action={
                <Button
                  variant="dark"
                  onClick={() => {
                    if (qrInput.trim()) findByQr()
                    else if (canScan) setScannerOpen(true)
                  }}
                >
                  Try again
                </Button>
              }
            >
              Ticket status could not be determined. Fix the connection and retry before updating.
            </EmptyState>
          </section>
        ) : null}

        <div className="sticky-bar">
          <div className="sticky-bar-inner">
            <Link className="btn" to={backTo}>
              Cancel
            </Link>
            {formReady ? (
              <Button
                type="submit"
                variant="primary"
                form="ticket-update-page-form"
                disabled={!canSubmitUpdate || formBusy || busy}
              >
                {formBusy ? 'Saving…' : 'Save update'}
              </Button>
            ) : null}
          </div>
        </div>
      </main>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={onQrScan}
      />
    </>
  )
}
