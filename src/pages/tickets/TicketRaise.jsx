import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { scanDeviceFacts } from '../../data/scanDevice'
import { ApiRequestError } from '../../services/api'
import { canScanWithCamera, resolveScan } from '../../services/devices'
import { listIssueCategories } from '../../services/issues'
import { createTicket } from '../../services/tickets'
import { uploadImages } from '../../services/uploads'
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
    location: `${scan.parkingLocation || scan.locationSite} · Slot ${scan.slotLabel || scan.slot}`,
    scan,
    dup: Boolean(scan.openTicketId),
  }
}

/** Prefer returning to All tickets with the same tab query when navigated from the list. */
function ticketsListReturnPath(from) {
  if (typeof from !== 'string') return '/tickets'
  const [pathname, query = ''] = from.split('?')
  if (pathname !== '/tickets') return '/tickets'
  return query ? `/tickets?${query}` : '/tickets'
}

export default function TicketRaise() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const canScan = canScanWithCamera(user)
  const resolveGen = useRef(0)

  const [qrInput, setQrInput] = useState('')
  const [device, setDevice] = useState(null)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [description, setDescription] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [issueCategories, setIssueCategories] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(true)

  const reportedBy = user?.name || ''
  const fromHere = `${location.pathname}${location.search}`
  const blocked = Boolean(device?.dup)
  const backToTickets = ticketsListReturnPath(location.state?.from)
  const busy = resolving || submitting

  const crumb = useMemo(
    () => (
      <>
        <Link to={backToTickets}>Tickets</Link> › New ticket
      </>
    ),
    [backToTickets],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to={backToTickets}>
        All tickets
      </Link>
    ),
    [backToTickets],
  )

  useEffect(() => {
    let cancelled = false
    listIssueCategories()
      .then((cats) => {
        if (!cancelled) setIssueCategories(cats)
      })
      .catch((err) => {
        if (!cancelled) {
          toastApiError(err, 'Could not load issue categories.')
          setIssueCategories([])
        }
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function clearProblemFields() {
    setCategory('')
    setSubCategory('')
    setDescription('')
    setPhotos([])
  }

  function clearDeviceState() {
    setDevice(null)
    clearProblemFields()
  }

  async function applyResolved(raw) {
    const gen = ++resolveGen.current
    clearDeviceState()
    setResolving(true)
    try {
      const scan = await resolveScan(raw)
      if (gen !== resolveGen.current) return
      if (!scan) {
        toast('No device matches that code.', 'error')
        return
      }
      setQrInput(scan.qrNumber || scan.qr || String(raw || '').trim())
      setDevice(applyScanToDevice(scan))
    } catch (err) {
      if (gen !== resolveGen.current) return
      clearDeviceState()
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

  async function tryRaise() {
    if (!device?.scan) {
      toast('Scan or enter a QR number first.', 'error')
      return
    }
    if (blocked) {
      toast('This device already has an open ticket. Update that ticket instead.', 'warning')
      return
    }
    if (!category || !subCategory) {
      toast('Select an issue category and sub-category.', 'error')
      return
    }

    setSubmitting(true)
    try {
      let photoUrls = []
      if (photos.length) {
        const uploaded = await uploadImages(photos)
        photoUrls = uploaded.map((u) => u.url).filter(Boolean)
      }

      const created = await createTicket({
        deviceId: device.scan.deviceId,
        categoryId: category,
        subCategoryId: subCategory,
        description: description.trim() || undefined,
        photos: photoUrls,
      })

      toastApiSuccess(created?.id ? `Ticket ${created.id} raised.` : 'Ticket raised.')
      if (created?.id) {
        navigate(openTicketPath(created.id), { state: { from: fromHere } })
      } else {
        navigate(backToTickets)
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'OPEN_TICKET_EXISTS') {
        const openId = err.details?.openTicketId || err.details?.ticketId
        toast(err.message || 'This device already has an open ticket.', 'warning')
        if (openId && device?.scan) {
          setDevice(
            applyScanToDevice({
              ...device.scan,
              openTicketId: openId,
              openTicketIssue: device.scan.openTicketIssue || 'Open',
              openTicketAge: device.scan.openTicketAge || 'now',
            }),
          )
        } else if (openId) {
          navigate(openTicketPath(openId), { state: { from: fromHere } })
        }
        return
      }
      if (err instanceof ApiRequestError && err.code === 'REOPEN_SAME_TICKET') {
        const ticketId = err.details?.ticketId || err.details?.openTicketId
        toast(err.message || 'Reopen the recent ticket instead of creating a new one.', 'warning')
        if (ticketId) navigate(openTicketPath(ticketId), { state: { from: fromHere } })
        return
      }
      toastApiError(err, 'Could not raise ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const openTicketId = device?.scan?.openTicketId

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
            <div style={{ marginBottom: 12 }}>
              <Button variant="dark" onClick={findByQr} disabled={busy}>
                {resolving ? 'Fetching device…' : 'Find device'}
              </Button>
            </div>

            {resolving ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Fetching device…
              </p>
            ) : null}

            {device?.scan && !resolving ? (
              <div>
                <DeviceCard
                  id={device.id}
                  location={device.location}
                  facts={scanDeviceFacts(device.scan)}
                />
                {blocked && openTicketId ? (
                  <div className="reclass" style={{ display: '', marginTop: 12 }}>
                    <div>
                      <b>This device already has an open ticket.</b>{' '}
                      {openTicketId} was raised {device.scan.openTicketAge || 'earlier'}
                      {device.scan.openTicketIssue
                        ? ` for ${device.scan.openTicketIssue.toLowerCase()}`
                        : ''}
                      . Add an update to that ticket instead of opening a second one.
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          className="btn btn-sm"
                          to={openTicketPath(openTicketId)}
                          state={{ from: fromHere }}
                        >
                          Open {openTicketId}
                        </Link>
                        <Link
                          className="btn btn-sm btn-primary"
                          to={openTicketPath(openTicketId)}
                          state={{ from: fromHere }}
                        >
                          Update existing ticket
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
              {issuesLoading ? (
                <p className="muted">Loading issue categories…</p>
              ) : (
                <IssueSelects
                  category={category}
                  subCategory={subCategory}
                  onCategoryChange={setCategory}
                  onSubCategoryChange={setSubCategory}
                  categories={issueCategories}
                  disabled={busy || !device}
                />
              )}
              <Field label="What is happening">
                <textarea
                  placeholder="e.g. Flap does not open after payment, two vehicles waiting"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={busy || !device}
                />
              </Field>
              <Field label="Photos">
                <PhotoPicker
                  hint="Up to 5 photos — the slot, the flap, the display."
                  onChange={setPhotos}
                  disabled={busy || !device}
                />
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
            <Link className="btn" to={backToTickets}>
              Cancel
            </Link>
            <Button
              variant="primary"
              onClick={tryRaise}
              disabled={blocked || !device || busy || issuesLoading}
            >
              {submitting ? 'Raising…' : resolving ? 'Fetching device…' : 'Raise ticket'}
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
