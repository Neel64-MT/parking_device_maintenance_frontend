import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { SCAN_HIT_CODES, SCAN_RESULT } from '../../data/devices'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'

export default function ScanQr() {
  const [manual, setManual] = useState('')
  const [state, setState] = useState('idle') // idle | hit | miss

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

  function findDevice(raw) {
    const v = (raw || '').trim().toUpperCase()
    if (!v) {
      setState('idle')
      toast('Enter a device ID, QR code or slot number.')
      return
    }
    const hit = SCAN_HIT_CODES.includes(v)
    setState(hit ? 'hit' : 'miss')
  }

  return (
    <>
      <PageMeta pageId="scan-qr" title="Scan QR" crumb={crumb} actions={actions} />

      <main className="page" style={{ maxWidth: 900 }}>
        <JumpLinks
          links={[
            { to: '/devices', label: 'Device list' },
            { to: '/tickets/raise', label: 'Raise a ticket' },
            { to: '/tickets/update', label: 'Update a ticket' },
          ]}
        />

        <div className="grid-2-even">
          <Panel title="Scan" subtitle="Point the camera at the QR sticker on the machine">
            <div className="scanbox">
              <div className="frame" />
              <h4>Waiting for a QR code</h4>
              <p>On a phone this opens the camera. Hold it about 20 cm from the sticker.</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" onClick={() => findDevice('QR-PD0428')}>
                Simulate a scan
              </Button>
            </div>
          </Panel>

          <Panel title="Sticker damaged?" subtitle="Type the device ID or slot number instead">
            <Field label="Device ID, QR code or slot number">
              <input
                type="text"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="e.g. PD-0428 or S2-114"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    findDevice(manual)
                  }
                }}
              />
            </Field>
            <Button variant="dark" onClick={() => findDevice(manual)}>
              Find device
            </Button>

            <p className="muted" style={{ marginTop: 14 }}>
              If the sticker is missing or unreadable, raise a ticket under QR / payment › QR plate
              missing so a replacement label gets printed.
            </p>
          </Panel>
        </div>

        {state === 'hit' ? (
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
                  <h3>{SCAN_RESULT.id}</h3>
                  <div className="sub">{SCAN_RESULT.location}</div>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <Pill tone={SCAN_RESULT.statusTone}>{SCAN_RESULT.status}</Pill>
                </div>
              </div>
              <div className="facts">
                {SCAN_RESULT.facts.map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <Link className="btn btn-primary" to="/tickets/raise">
                Raise a ticket
              </Link>
              <Link className="btn" to={`/devices/${SCAN_RESULT.id}`}>
                View history
              </Link>
              <Link className="btn" to={`/tickets/${SCAN_RESULT.openTicketId}`}>
                Open {SCAN_RESULT.openTicketId}
              </Link>
            </div>
          </section>
        ) : null}

        {state === 'miss' ? (
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
      </main>
    </>
  )
}
