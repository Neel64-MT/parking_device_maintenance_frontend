import { useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError } from '../../context/ToastContext'
import { scanDeviceFacts, scanStatusTone } from '../../data/scanDevice'
import { canScanWithCamera, resolveScan } from '../../services/devices'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { QrScannerModal } from '../../components/ui/QrScannerModal'

export default function ScanQr() {
  const { user } = useAuth()
  const location = useLocation()
  const canScan = canScanWithCamera(user)
  const resolveGen = useRef(0)

  const [manual, setManual] = useState('')
  const [state, setState] = useState('idle') // idle | hit | miss | error
  const [scan, setScan] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const fromHere = `${location.pathname}${location.search}`

  const crumb = useMemo(
    () => (
      <>
        <Link to="/devices">Devices</Link> › Scan a QR sticker
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/devices">
        Device list
      </Link>
    ),
    [],
  )

  async function findDevice(raw) {
    const v = (raw || '').trim()
    if (!v) {
      setState('idle')
      setScan(null)
      toast('Enter a device ID, QR code or slot number.', 'error')
      return
    }

    const gen = ++resolveGen.current
    setResolving(true)
    setScan(null)
    setState('idle')
    try {
      const result = await resolveScan(v)
      if (gen !== resolveGen.current) return
      if (!result) {
        setState('miss')
        setScan(null)
        return
      }
      setScan(result)
      setState('hit')
    } catch (err) {
      if (gen !== resolveGen.current) return
      setState('error')
      setScan(null)
      toastApiError(err, 'Could not look up that device.')
    } finally {
      if (gen === resolveGen.current) setResolving(false)
    }
  }

  function onQrScan(text) {
    findDevice(text)
  }

  return (
    <>
      <PageMeta pageId="scan-qr" title="Scan QR" crumb={crumb} actions={actions} />

      <main className="page" style={{ maxWidth: 900 }}>
        <JumpLinks
          links={[
            { to: '/devices', label: 'Device list' },
            { to: '/tickets/raise', label: 'Raise a ticket' },
          ]}
        />

        <div className="grid-2-even">
          <Panel title="Scan" subtitle="Point the camera at the QR sticker on the machine">
            <div className="scanbox">
              <div className="frame" />
              <h4>Waiting for a QR code</h4>
              <p>On a phone this opens the camera. Hold it about 20 cm from the sticker.</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {canScan ? (
                <Button
                  variant="primary"
                  onClick={() => setScannerOpen(true)}
                  disabled={resolving}
                >
                  Open camera
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Sticker damaged?" subtitle="Type the device ID or slot number instead">
            <Field label="Device ID, QR code or slot number">
              <input
                type="text"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. PD-0428, AMCC2346, or slot Id"
                disabled={resolving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    findDevice(manual)
                  }
                }}
              />
            </Field>
            <Button variant="dark" onClick={() => findDevice(manual)} disabled={resolving}>
              {resolving ? 'Fetching device…' : 'Find device'}
            </Button>

            <p className="muted" style={{ marginTop: 14 }}>
              If the sticker is missing or unreadable, raise a ticket under QR / payment › QR plate
              missing so a replacement label gets printed.
            </p>
          </Panel>
        </div>

        {resolving ? (
          <section className="panel">
            <div className="panel-body">
              <p className="muted" style={{ margin: 0 }}>
                Fetching device…
              </p>
            </div>
          </section>
        ) : null}

        {state === 'hit' && scan && !resolving ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Device found</h3>
                <p>Check this is the machine in front of you before acting</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="record-top">
                <div>
                  <h3>{scan.deviceId}</h3>
                  <div className="sub">
                    {scan.deviceName} · {scan.parkingLocation || scan.locationSite} · Slot{' '}
                    {scan.slotLabel || scan.slot}
                  </div>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <Pill tone={scanStatusTone(scan)}>{scan.currentStatus}</Pill>
                </div>
              </div>
              <div className="facts">
                {scanDeviceFacts(scan).map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              {scan.openTicketId ? (
                <>
                  <Link
                    className="btn btn-primary"
                    to={`/tickets/${encodeURIComponent(scan.openTicketId)}`}
                    state={{ from: fromHere }}
                  >
                    Update existing ticket
                  </Link>
                  <Link
                    className="btn"
                    to={`/tickets/${encodeURIComponent(scan.openTicketId)}`}
                    state={{ from: fromHere }}
                  >
                    Open {scan.openTicketId}
                  </Link>
                </>
              ) : (
                <Link className="btn btn-primary" to="/tickets/raise" state={{ from: fromHere }}>
                  Raise a ticket
                </Link>
              )}
              <Link className="btn" to={`/devices/${encodeURIComponent(scan.deviceId)}`}>
                View history
              </Link>
            </div>
          </section>
        ) : null}

        {state === 'miss' && !resolving ? (
          <section className="panel">
            <EmptyState
              title="No device matches that code"
              action={
                <Link className="btn" to="/devices">
                  Search device list
                </Link>
              }
            >
              Check the number on the sticker, or search the device list by slot number.
            </EmptyState>
          </section>
        ) : null}

        {state === 'error' && !resolving ? (
          <section className="panel">
            <EmptyState
              title="Could not check this device"
              action={
                <Button variant="dark" onClick={() => findDevice(manual)}>
                  Try again
                </Button>
              }
            >
              Ticket status could not be determined. Fix the connection and retry before raising a
              ticket.
            </EmptyState>
          </section>
        ) : null}
      </main>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={onQrScan}
      />
    </>
  )
}
