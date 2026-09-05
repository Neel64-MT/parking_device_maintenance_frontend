import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS, SLOTS } from '../../data/slots'
import { canScanWithCamera } from '../../services/devices'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { PartChips } from '../../components/ui/PartChips'
import { PhotoPicker } from '../../components/ui/PhotoPicker'
import { QrScannerModal } from '../../components/ui/QrScannerModal'
import { TeamSelect } from '../../components/ui/TeamSelect'

function ScanIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </svg>
  )
}

export default function TicketUpdate() {
  const { user } = useAuth()
  const canScan = canScanWithCamera(user)
  const navigate = useNavigate()
  const [road, setRoad] = useState('')
  const [slot, setSlot] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [fixed, setFixed] = useState(null)
  const [assignee, setAssignee] = useState('Keep it with me')
  const [scannerOpen, setScannerOpen] = useState(false)

  const slotOptions = road ? SLOTS[road] || [] : []
  const reclassed =
    loaded &&
    Boolean(category && subCategory) &&
    !(category === 'Electrical' && subCategory === 'Controller board failure')

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> › <Link to="/tickets/TK-1042">TK-1042</Link> › Site visit
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/tickets">
        My tickets
      </Link>
    ),
    [],
  )

  function fillSlots(nextRoad) {
    setRoad(nextRoad)
    setSlot('')
  }

  function loadTicket() {
    setLoaded(true)
    setCategory('Electrical')
    setSubCategory('Controller board failure')
  }

  function onQrScan() {
    // Any QR → existing mock inspection flow (do not rewrite panels).
    loadTicket()
  }

  function save() {
    if (fixed) navigate('/tickets/close')
    else toast('Update saved. Ticket stays open.')
  }

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
                <p>Scan the sticker in front of you, or pick road and slot</p>
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
              <button type="button" className="scan-btn" onClick={loadTicket}>
                <ScanIcon />
                Load open ticket (preview)
              </button>
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

            <Field label="Slot number" style={{ marginBottom: 0 }}>
              <select
                value={slot}
                onChange={(e) => {
                  setSlot(e.target.value)
                  loadTicket()
                }}
                disabled={!road}
              >
                <option value="">{road ? 'Select slot' : 'Select a road first'}</option>
                {slotOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {loaded ? (
          <div>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Open ticket on this device</h3>
                  <p>TK-1042 · raised 8 days ago</p>
                </div>
                <Link className="link" to="/tickets/TK-1042">
                  Full history
                </Link>
              </div>
              <div className="panel-body">
                <DeviceCard
                  id="PD-0428"
                  location="Science City · Slot S2-114"
                  facts={[
                    { label: 'Reported as', value: 'Controller board failure' },
                    { label: 'Reported by', value: 'Site attendant' },
                    { label: 'Visits so far', value: '3' },
                  ]}
                />
                <p className="muted" style={{ marginTop: 12 }}>
                  Last update on 30 Aug: waiting for the motor assembly, dispatch expected 02 Sep.
                </p>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="step-head">
                  <div className="step-n">2</div>
                  <div>
                    <h3>What did you find</h3>
                    <p>Change the category if the real fault is different</p>
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
                {reclassed ? (
                  <div className="reclass" style={{ margin: '14px 0 0' }}>
                    <div>
                      Changing from <b>Electrical › Controller board failure</b>
                      <span className="arrow">→</span>
                      <b>
                        {category} › {subCategory || '—'}
                      </b>
                      . The original report is kept on the ticket.
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div className="step-head">
                  <div className="step-n">3</div>
                  <div>
                    <h3>Did you fix it today</h3>
                    <p>Log the visit either way</p>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="seg">
                  <button
                    type="button"
                    className={fixed ? 'on-ok' : undefined}
                    onClick={() => setFixed(true)}
                  >
                    Yes, fixed
                  </button>
                  <button
                    type="button"
                    className={fixed === false ? 'on-bad' : undefined}
                    onClick={() => setFixed(false)}
                  >
                    No, still open
                  </button>
                </div>
              </div>
            </section>

            {fixed ? (
              <section className="panel">
                <div className="panel-head">
                  <div className="step-head">
                    <div className="step-n">4</div>
                    <div>
                      <h3>What you did</h3>
                      <p>This becomes the resolution on the ticket</p>
                    </div>
                  </div>
                </div>
                <div className="panel-body">
                  <Field label="Work done">
                    <textarea placeholder="e.g. Replaced motor and gearbox assembly, reset travel limits, tested 5 open-close cycles." />
                  </Field>
                  <Field
                    label="Parts changed"
                    hint="Tap every part you replaced. Leave blank if nothing was changed."
                  >
                    <PartChips />
                  </Field>
                  <Field
                    label="Cost of this visit"
                    hint="Parts plus labour spent today. Added to the ticket total."
                  >
                    <input type="number" placeholder="0" />
                  </Field>
                  <Field label="Photos after repair" style={{ marginBottom: 0 }}>
                    <PhotoPicker hint="Photograph the repaired device before you leave." />
                  </Field>
                </div>
              </section>
            ) : null}

            {fixed === false ? (
              <section className="panel">
                <div className="panel-head">
                  <div className="step-head">
                    <div className="step-n">4</div>
                    <div>
                      <h3>What you did today</h3>
                      <p>The ticket stays open and this is added to its history</p>
                    </div>
                  </div>
                </div>
                <div className="panel-body">
                  <Field label="Work done today">
                    <textarea placeholder="e.g. Opened the housing, confirmed the gearbox is seized. Cannot repair on site. Slot barricaded." />
                  </Field>
                  <Field label="Why it is not fixed">
                    <select defaultValue="Spare not available">
                      <option>Spare not available</option>
                      <option>Spare ordered, waiting for delivery</option>
                      <option>Needs civil work at the slot</option>
                      <option>Needs traffic police or AMC support</option>
                      <option>Needs more diagnosis</option>
                      <option>No access — vehicle parked on the slot</option>
                      <option>Rain, work stopped</option>
                    </select>
                  </Field>
                  <Field label="Next visit planned">
                    <input type="date" />
                  </Field>
                  <Field
                    label="Parts changed today"
                    hint="A part can be changed even when the fault is not fully resolved."
                  >
                    <PartChips />
                  </Field>
                  <Field label="Cost of this visit">
                    <input type="number" placeholder="0" />
                  </Field>
                  <Field label="Photos">
                    <PhotoPicker hint="Photograph what you found, even if nothing was fixed." />
                  </Field>
                  <Field
                    label="Hand over to"
                    hint="Keep it with yourself, or pass it on. Whoever holds it last is the one who closes it."
                    style={{ marginBottom: 0 }}
                  >
                    <TeamSelect
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      firstOption="Keep it with me"
                    />
                  </Field>
                </div>
                <div className="foot-note">
                  A visit that fixes nothing is still worth recording. Three such visits is what
                  shows you a spares problem rather than a technician problem.
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {loaded ? (
          <div className="sticky-bar">
            <div className="sticky-bar-inner">
              <Link className="btn" to="/tickets">
                Cancel
              </Link>
              <Button
                variant={fixed === false ? 'dark' : 'primary'}
                onClick={save}
              >
                {fixed === true
                  ? 'Fix done, close ticket'
                  : fixed === false
                    ? 'Save update, keep open'
                    : 'Save update'}
              </Button>
            </div>
          </div>
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
