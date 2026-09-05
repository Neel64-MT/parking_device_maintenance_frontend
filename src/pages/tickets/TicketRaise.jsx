import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { scanDeviceFacts } from '../../data/scanDevice'
import { ROAD_OPTIONS, SLOTS } from '../../data/slots'
import { canScanWithCamera, resolveScan } from '../../services/devices'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { PhotoPicker } from '../../components/ui/PhotoPicker'
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
    location: `${scan.locationSite} · Slot ${scan.slot}`,
    scan,
    dup: Boolean(scan.openTicketId),
  }
}

export default function TicketRaise() {
  const { user } = useAuth()
  const canScan = canScanWithCamera(user)
  const [road, setRoad] = useState('')
  const [slot, setSlot] = useState('')
  const [device, setDevice] = useState(null)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const reportedBy = user?.name || ''
  const slotOptions = road ? SLOTS[road] || [] : []
  const blocked = Boolean(device?.dup)

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> › New ticket
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/tickets">
        All tickets
      </Link>
    ),
    [],
  )

  function fillSlots(nextRoad) {
    setRoad(nextRoad)
    setSlot('')
    setDevice(null)
  }

  async function applyResolved(raw, opts = {}) {
    const scan = await resolveScan(raw)
    if (!scan) {
      toast('Could not resolve that device code.')
      return
    }
    if (opts.road) setRoad(opts.road)
    else if (!road) setRoad(scan.locationSite)
    if (opts.slot) setSlot(opts.slot)
    else setSlot(`${scan.slot} — ${scan.deviceId}`)
    setDevice(applyScanToDevice(scan))
  }

  function pickDevice(nextSlot) {
    const nextRoad = road || 'Science City'
    const chosen = nextSlot || slot || 'S2-114 — PD-0428'
    const parts = chosen.split(' — ')
    const deviceId = parts[1] || chosen
    if (!road) setRoad(nextRoad)
    if (nextSlot) setSlot(nextSlot)
    applyResolved(deviceId, { road: nextRoad, slot: nextSlot || chosen })
  }

  function onQrScan(text) {
    applyResolved(text)
  }

  function tryRaise() {
    if (!device) {
      toast('Scan or select a device first.')
      return
    }
    if (blocked) {
      toast('This device already has an open ticket. Update that ticket instead.')
      return
    }
    toast('Design preview — ticket would be created here.')
  }

  return (
    <>
      <PageMeta pageId="ticket-raise" title="Raise ticket" crumb={crumb} actions={actions} />

      <main className="page mobile">
        <section className="panel">
          <div className="panel-head">
            <div className="step-head">
              <div className="step-n">1</div>
              <div>
                <h3>Which device</h3>
                <p>Scan the sticker, or pick road and slot</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            {canScan ? (
              <button type="button" className="scan-btn" onClick={() => setScannerOpen(true)}>
                <ScanIcon />
                Scan QR on the machine
              </button>
            ) : (
              <p className="muted" style={{ marginBottom: 12 }}>
                Camera scan is available to Site attendants and Technicians. Pick road and slot
                below.
              </p>
            )}

            <div className="or">or select manually</div>

            <Field label="Road">
              <select value={road} onChange={(e) => fillSlots(e.target.value)}>
                <option value="">Select road</option>
                {ROAD_OPTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>

            <Field label="Slot number">
              <select
                value={slot}
                onChange={(e) => pickDevice(e.target.value)}
                disabled={!road}
              >
                <option value="">{road ? 'Select slot' : 'Select a road first'}</option>
                {slotOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            {device?.scan ? (
              <div>
                <DeviceCard
                  id={device.id}
                  location={device.location}
                  facts={scanDeviceFacts(device.scan)}
                />
                {blocked ? (
                  <div className="reclass" style={{ display: '', marginTop: 12 }}>
                    <div>
                      <b>This device already has an open ticket.</b>{' '}
                      {device.scan.openTicketId} was raised {device.scan.openTicketAge || 'earlier'}
                      {device.scan.openTicketIssue
                        ? ` for ${device.scan.openTicketIssue.toLowerCase()}`
                        : ''}
                      . Add an update to that ticket instead of opening a second one.
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link className="btn btn-sm" to={`/tickets/${device.scan.openTicketId}`}>
                          Open {device.scan.openTicketId}
                        </Link>
                        <Link className="btn btn-sm" to="/tickets/update">
                          Update ticket
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {!blocked ? (
          <section className="panel">
            <div className="panel-head">
              <div className="step-head">
                <div className="step-n">2</div>
                <div>
                  <h3>What is the problem</h3>
                  <p>Pick the closest match — the engineer confirms it on site</p>
                </div>
              </div>
            </div>
            <div className="panel-body">
              <IssueSelects
                category={category}
                subCategory={subCategory}
                onCategoryChange={setCategory}
                onSubCategoryChange={setSubCategory}
              />
              <Field label="What is happening">
                <textarea placeholder="e.g. Flap does not open after payment, two vehicles waiting" />
              </Field>
              <Field label="Photos">
                <PhotoPicker hint="Add as many photos as you need — the slot, the flap, the display." />
              </Field>
              <Field
                label="Reported by"
                hint="Taken from the signed-in account. Assignment is done by Admin / control room."
                style={{ marginBottom: 0 }}
              >
                <input
                  type="text"
                  value={reportedBy}
                  disabled
                  readOnly
                  aria-readonly="true"
                />
              </Field>
            </div>
            <div className="foot-note">
              Guessing the category wrong costs nothing. If the engineer finds something else, they
              change it on the ticket and both are kept.
            </div>
          </section>
        ) : null}

        <div className="sticky-bar">
          <div className="sticky-bar-inner">
            <Link className="btn" to="/tickets">
              Cancel
            </Link>
            <Button variant="primary" onClick={tryRaise} disabled={blocked || !device}>
              Raise ticket
            </Button>
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
