import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS, SLOTS } from '../../data/slots'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { PhotoPicker } from '../../components/ui/PhotoPicker'

function ScanIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </svg>
  )
}

export default function TicketRaise() {
  const { user } = useAuth()
  const [road, setRoad] = useState('')
  const [slot, setSlot] = useState('')
  const [device, setDevice] = useState(null)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')

  const reportedBy = user?.name || ''
  const slotOptions = road ? SLOTS[road] || [] : []

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

  function pickDevice(nextSlot) {
    const nextRoad = road || 'Science City'
    const chosen = nextSlot || slot || 'S2-114 — PD-0428'
    const parts = chosen.split(' — ')
    const deviceId = parts[1] || 'PD-0428'
    const open = deviceId === 'PD-0428'

    if (!road) setRoad(nextRoad)
    if (nextSlot) setSlot(nextSlot)

    setDevice({
      id: deviceId,
      location: `${nextRoad} · Slot ${parts[0]}`,
      status: open ? 'Under repair' : 'Working',
      tickets: open ? '6' : '1',
      dup: open,
    })
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
            <button type="button" className="scan-btn" onClick={() => pickDevice()}>
              <ScanIcon />
              Scan QR on the machine
            </button>

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

            {device ? (
              <div>
                <DeviceCard
                  id={device.id}
                  location={device.location}
                  facts={[
                    { label: 'Status', value: device.status },
                    { label: 'Installed', value: '02 Apr 2026' },
                    { label: 'Tickets in 6 months', value: device.tickets },
                  ]}
                />
                {device.dup ? (
                  <div className="reclass" style={{ display: '', marginTop: 12 }}>
                    <div>
                      <b>This device already has an open ticket.</b> TK-1042 was raised 8 days ago
                      for a motor failure. Add an update to that ticket instead of opening a second
                      one.
                      <div style={{ marginTop: 10 }}>
                        <Link className="btn btn-sm" to="/tickets/update">
                          Update TK-1042
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

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

        <div className="sticky-bar">
          <div className="sticky-bar-inner">
            <Link className="btn" to="/tickets">
              Cancel
            </Link>
            <Button variant="primary" onClick={() => toast('Design preview — ticket would be created here.')}>
              Raise ticket
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}
