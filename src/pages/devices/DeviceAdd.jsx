import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS } from '../../data/slots'
import { ApiRequestError } from '../../services/api'
import { getDevice } from '../../services/devices'
import { listRoadLookups } from '../../services/roads'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'

function toDateInput(value) {
  if (value == null || value === '') return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    const s = String(value)
    return s.length >= 10 ? s.slice(0, 10) : s
  }
  return d.toISOString().slice(0, 10)
}

export default function DeviceAdd() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id') || ''
  const isEdit = Boolean(editId)

  const [slotId, setSlotId] = useState('')
  const [slotLabel, setSlotLabel] = useState('')
  const [slotIdentifier, setSlotIdentifier] = useState('')
  const [qrNumber, setQrNumber] = useState('')
  const [road, setRoad] = useState('')
  const [roadOptions, setRoadOptions] = useState(ROAD_OPTIONS)
  const [side, setSide] = useState('Left')
  const [landmark, setLandmark] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [model, setModel] = useState('Flap barrier — 4 wheeler')
  const [installed, setInstalled] = useState('')
  const [commissioned, setCommissioned] = useState('')
  const [status, setStatus] = useState('Working')
  const [photo, setPhoto] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loadingEdit, setLoadingEdit] = useState(() => Boolean(editId))
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    listRoadLookups()
      .then((rows) => {
        if (cancelled || !rows.length) return
        setRoadOptions(rows.map((r) => r.name).filter(Boolean))
      })
      .catch(() => {
        /* keep ROAD_OPTIONS fallback */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!editId) return
    let cancelled = false

    async function load() {
      setLoadingEdit(true)
      setLoadError('')
      try {
        const data = await getDevice(editId)
        if (cancelled) return
        const h = data?.header || {}
        const facts = Array.isArray(h.facts) ? h.facts : []
        const fact = (label) => facts.find((f) => f.label === label)?.value

        setSlotId(
          h.slotId != null && h.slotId !== ''
            ? String(h.slotId)
            : h.id && !String(h.id).startsWith('PD-')
              ? String(h.id)
              : '',
        )
        setSlotLabel(h.slotLabel || h.slot || '')
        setSlotIdentifier(h.slotIdentifier || '')
        setQrNumber(h.qrNumber || h.qr || '')
        setRoad(h.parkingLocation || h.road || '')
        setSide(fact('Side of road') && fact('Side of road') !== '—' ? fact('Side of road') : 'Left')
        setInstalled(toDateInput(fact('Installed')))
        setModel(fact('Model') || 'Flap barrier — 4 wheeler')
        setStatus(h.status === 'Under installation' || h.status === 'Not working' ? h.status : 'Working')
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiRequestError ? err.message : 'Could not load device for edit.',
          )
        }
      } finally {
        if (!cancelled) setLoadingEdit(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [editId])

  const crumb = useMemo(
    () => (
      <>
        <Link to="/devices">Devices</Link> › {isEdit ? 'Edit device' : 'New device'}
      </>
    ),
    [isEdit],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/devices">
        Back to list
      </Link>
    ),
    [],
  )

  function handleSubmit(e, mode) {
    e.preventDefault()
    if (loadingEdit) return
    if (isEdit) {
      toast(
        mode === 'print'
          ? 'Design preview — device updated and QR label would print.'
          : 'Design preview — device updated.',
        'success',
      )
      return
    }
    if (mode === 'print') {
      toast('Design preview — device saved and QR label would print.', 'success')
      return
    }
    if (mode === 'another') {
      toast('Design preview — device saved. Form ready for another.', 'success')
      setSlotId('')
      setSlotLabel('')
      setSlotIdentifier('')
      setQrNumber('')
      setRoad('')
      setLandmark('')
      setLat('')
      setLng('')
      setInstalled('')
      setCommissioned('')
      setPhoto('')
      setRemarks('')
      return
    }
    toast('Design preview — device saved.', 'success')
  }

  return (
    <>
      <PageMeta
        pageId="device-add"
        title={isEdit ? 'Edit device' : 'Add device'}
        crumb={crumb}
        actions={actions}
      />

      <main className="page" style={{ maxWidth: 980 }}>
        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e, 'save')
          }}
        >
          <Panel
            title="Slot and QR"
            subtitle="Slot Id is the identity used on tickets and history. QR is what a technician scans on site."
          >
            <div className="form-grid">
              <Field
                label="Slot Id"
                required
                hint="Primary identity after Device Sync. Used on ticket list and device history."
              >
                <input
                  type="text"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  placeholder="e.g. 10428"
                  disabled={loadingEdit}
                />
              </Field>
              <Field
                label="Slot Label"
                required
                hint="Label painted on site / slot_number (e.g. CG-33)."
              >
                <input
                  type="text"
                  value={slotLabel}
                  onChange={(e) => setSlotLabel(e.target.value)}
                  placeholder="e.g. CG-33"
                  disabled={loadingEdit}
                />
              </Field>
              <Field
                label="Slot Identifier"
                hint="Optional external identifier when provided by SmartPark."
              >
                <input
                  type="text"
                  value={slotIdentifier}
                  onChange={(e) => setSlotIdentifier(e.target.value)}
                  placeholder="Optional"
                  disabled={loadingEdit}
                />
              </Field>
              <Field
                label="QR Number"
                required
                hint="Printed and pasted on the machine body. Print the label after saving."
              >
                <input
                  type="text"
                  value={qrNumber}
                  onChange={(e) => setQrNumber(e.target.value)}
                  placeholder="e.g. QR-…"
                  disabled={loadingEdit}
                />
              </Field>
              <Field label="Model">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingEdit}
                >
                  <option>Flap barrier — 4 wheeler</option>
                  <option>Flap barrier — 2 wheeler</option>
                </select>
              </Field>
            </div>
          </Panel>

          <Panel
            title="Parking location"
            subtitle="Parking Location comes from Masters → Road (or Device Sync locations)"
            link="Add a road"
            linkTo="/masters/roads/add"
          >
            <div className="form-grid">
              <Field label="Parking Location" required>
                <select
                  value={road}
                  onChange={(e) => setRoad(e.target.value)}
                  disabled={loadingEdit}
                >
                  <option value="">Select parking location</option>
                  {roadOptions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Side of road">
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  disabled={loadingEdit}
                >
                  <option>Left</option>
                  <option>Right</option>
                </select>
              </Field>
              <Field label="Nearest landmark">
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Helps the technician find the slot"
                  disabled={loadingEdit}
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="23.0225"
                  disabled={loadingEdit}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="72.5714"
                  disabled={loadingEdit}
                />
              </Field>
            </div>
          </Panel>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Installation</h3>
                <p>When the device went live on this slot</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                <Field label="Installation date" required>
                  <input
                    type="date"
                    value={installed}
                    onChange={(e) => setInstalled(e.target.value)}
                    disabled={loadingEdit}
                  />
                </Field>
                <Field label="Commissioned on">
                  <input
                    type="date"
                    value={commissioned}
                    onChange={(e) => setCommissioned(e.target.value)}
                    disabled={loadingEdit}
                  />
                </Field>
                <Field
                  label="Status"
                  required
                  hint="After go-live the status changes on its own from open tickets, not by hand."
                >
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={loadingEdit}
                  >
                    <option>Working</option>
                    <option>Under installation</option>
                    <option>Not working</option>
                  </select>
                </Field>
                <Field label="Installation photo" className="span-2">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="Upload — geo-tagged photo of the installed slot"
                    disabled={loadingEdit}
                  />
                </Field>
                <Field label="Remarks" className="span-2">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Site conditions worth recording — waterlogging point, tight slot, heavy two-wheeler entry, and so on."
                    disabled={loadingEdit}
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={loadingEdit}>
                {isEdit ? 'Save changes' : 'Save device'}
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, 'print')} disabled={loadingEdit}>
                Save and print QR label
              </Button>
              {!isEdit ? (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'another')}
                  disabled={loadingEdit}
                >
                  Save and add another
                </Button>
              ) : null}
              <div className="right">
                <Link className="btn" to="/devices">
                  Cancel
                </Link>
              </div>
            </div>
          </section>
        </form>
      </main>
    </>
  )
}
