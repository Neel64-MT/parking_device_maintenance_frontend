import { useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError } from '../../context/ToastContext'
import { scanDeviceFacts } from '../../data/scanDevice'
import { canScanWithCamera, resolveScan } from '../../services/devices'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/FilterBar'
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

export default function TicketUpdate() {
  const { user } = useAuth()
  const canScan = canScanWithCamera(user)
  const location = useLocation()
  const resolveGen = useRef(0)

  const [qrInput, setQrInput] = useState('')
  const [device, setDevice] = useState(null)
  const [lookupState, setLookupState] = useState('idle') // idle | hit | miss | error
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resolving, setResolving] = useState(false)

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

  async function applyResolved(raw) {
    const gen = ++resolveGen.current
    clearResult()
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

  const openTicketId = device?.scan?.openTicketId
  const busy = resolving

  return (
    <>
      <PageMeta pageId="ticket-update" title="Update ticket" crumb={crumb} actions={actions} />

      <main className="page mobile">
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
                {resolving ? 'Fetching device…' : 'Find device'}
              </Button>
            </div>

            {resolving ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Fetching device…
              </p>
            ) : null}
          </div>
        </section>

        {lookupState === 'hit' && device?.scan && !resolving ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{openTicketId ? 'Open ticket on this device' : 'Device found'}</h3>
                <p>
                  {openTicketId
                    ? `${openTicketId}${device.scan.openTicketAge ? ` · raised ${device.scan.openTicketAge} ago` : ''}`
                    : 'There is no open ticket to update on this machine'}
                </p>
              </div>
              {openTicketId ? (
                <Link className="link" to={openTicketPath(openTicketId)} state={{ from: fromHere }}>
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
              {openTicketId ? (
                <div className="reclass" style={{ display: '', marginTop: 12 }}>
                  <div>
                    <b>Update this ticket instead of raising another.</b>{' '}
                    {device.scan.openTicketIssue
                      ? `Current issue: ${device.scan.openTicketIssue}.`
                      : ''}
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        className="btn btn-sm btn-primary"
                        to={openTicketPath(openTicketId)}
                        state={{ from: fromHere }}
                      >
                        Update existing ticket
                      </Link>
                      <Link
                        className="btn btn-sm"
                        to={openTicketPath(openTicketId)}
                        state={{ from: fromHere }}
                      >
                        Open {openTicketId}
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
                        state={{ from: fromHere }}
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

        {lookupState === 'miss' && !resolving ? (
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

        {lookupState === 'error' && !resolving ? (
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
