import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS, SLOTS } from '../../data/slots'
import { ApiRequestError } from '../../services/api'
import { canScanWithCamera } from '../../services/devices'
import { uploadImages } from '../../services/uploads'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { PartChips } from '../../components/ui/PartChips'
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

export default function TicketUpdate() {
  const { user } = useAuth()
  const canScan = canScanWithCamera(user)
  const navigate = useNavigate()
  const location = useLocation()
  const [road, setRoad] = useState('')
  const [slot, setSlot] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [fixed, setFixed] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [photosFixed, setPhotosFixed] = useState([])
  const [photosOpen, setPhotosOpen] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const slotOptions = road ? SLOTS[road] || [] : []
  const reclassed =
    loaded &&
    Boolean(category && subCategory) &&
    !(category === 'Electrical' && subCategory === 'Controller board failure')

  const backTo =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('/tickets/update')
      ? location.state.from
      : '/tickets'

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
      <Link className="btn" to={backTo}>
        My tickets
      </Link>
    ),
    [backTo],
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

  function cancel() {
    if (
      typeof location.state?.from === 'string' &&
      location.state.from.startsWith('/') &&
      !location.state.from.startsWith('/tickets/update')
    ) {
      navigate(location.state.from)
      return
    }
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate('/tickets')
  }

  async function save() {
    const pending = fixed ? photosFixed : photosOpen
    setSubmitting(true)
    try {
      let photoUrls = []
      if (pending.length) {
        const uploaded = await uploadImages(pending)
        photoUrls = uploaded.map((u) => u.url)
      }
      // photoUrls ready for update/close API when wired
      if (fixed) navigate('/tickets/close', { state: { from: backTo } })
      else {
        toast(
          photoUrls.length
            ? `Update saved. Ticket stays open (${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''} ready).`
            : 'Update saved. Ticket stays open.',
        )
        navigate(backTo)
      }
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not upload images.')
    } finally {
      setSubmitting(false)
    }
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
                  <Field label="Photos after repair">
                    <PhotoPicker
                      hint="Photograph the repaired device before you leave."
                      onChange={setPhotosFixed}
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Work done" style={{ marginBottom: 0 }}>
                    <textarea placeholder="e.g. Replaced motor and gearbox assembly, reset travel limits, tested 5 open-close cycles." />
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
                    <PhotoPicker
                      hint="Photograph what you found, even if nothing was fixed."
                      onChange={setPhotosOpen}
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Work done today" style={{ marginBottom: 0 }}>
                    <textarea placeholder="e.g. Opened the housing, confirmed the gearbox is seized. Cannot repair on site. Slot barricaded." />
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

        <div className="sticky-bar">
          <div className="sticky-bar-inner">
            <Button type="button" onClick={cancel}>
              Cancel
            </Button>
            {loaded ? (
              <Button
                variant={fixed === false ? 'dark' : 'primary'}
                onClick={save}
                disabled={submitting}
              >
                {submitting
                  ? 'Uploading…'
                  : fixed === true
                    ? 'Fix done, close ticket'
                    : fixed === false
                      ? 'Save update, keep open'
                      : 'Save update'}
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
