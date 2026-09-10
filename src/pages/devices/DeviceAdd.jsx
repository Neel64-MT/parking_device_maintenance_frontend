import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ROAD_OPTIONS } from '../../data/slots'
import { ApiRequestError } from '../../services/api'
import { getDevice, updateDevice } from '../../services/devices'
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

function snapshotFromForm(values) {
  return {
    slotLabel: values.slotLabel,
    slotIdentifier: values.slotIdentifier,
    qrNumber: values.qrNumber,
    road: values.road,
    side: values.side,
    landmark: values.landmark,
    lat: values.lat,
    lng: values.lng,
    model: values.model,
    installed: values.installed,
    commissioned: values.commissioned,
    status: values.status,
    photo: values.photo,
    remarks: values.remarks,
  }
}

export default function DeviceAdd() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id') || ''
  const isEdit = Boolean(editId)

  const [slotId, setSlotId] = useState('')
  const [slotLabel, setSlotLabel] = useState('')
  const [slotIdentifier, setSlotIdentifier] = useState('')
  const [qrNumber, setQrNumber] = useState('')
  const [road, setRoad] = useState('')
  const [roads, setRoads] = useState([])
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
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    listRoadLookups()
      .then((rows) => {
        if (cancelled || !rows.length) return
        setRoads(rows)
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
      setInitialSnapshot(null)
      try {
        const data = await getDevice(editId)
        if (cancelled) return
        const h = data?.header || {}
        const facts = Array.isArray(h.facts) ? h.facts : []
        const fact = (label) => facts.find((f) => f.label === label)?.value

        const next = {
          slotId:
            h.slotId != null && h.slotId !== ''
              ? String(h.slotId)
              : h.id && !String(h.id).startsWith('PD-')
                ? String(h.id)
                : '',
          slotLabel: h.slotLabel || h.slot || '',
          slotIdentifier: h.slotIdentifier || '',
          qrNumber: h.qrNumber || h.qr || '',
          road: h.parkingLocation || h.road || '',
          side: fact('Side of road') && fact('Side of road') !== '—' ? fact('Side of road') : 'Left',
          landmark: '',
          lat: '',
          lng: '',
          model: fact('Model') || 'Flap barrier — 4 wheeler',
          installed: toDateInput(fact('Installed')),
          commissioned: '',
          status:
            h.status === 'Under installation' || h.status === 'Not working' ? h.status : 'Working',
          photo: '',
          remarks: '',
        }

        setSlotId(next.slotId)
        setSlotLabel(next.slotLabel)
        setSlotIdentifier(next.slotIdentifier)
        setQrNumber(next.qrNumber)
        setRoad(next.road)
        setSide(next.side)
        setLandmark(next.landmark)
        setLat(next.lat)
        setLng(next.lng)
        setModel(next.model)
        setInstalled(next.installed)
        setCommissioned(next.commissioned)
        setStatus(next.status)
        setPhoto(next.photo)
        setRemarks(next.remarks)
        setInitialSnapshot(snapshotFromForm(next))
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

  const currentSnapshot = useMemo(
    () =>
      snapshotFromForm({
        slotLabel,
        slotIdentifier,
        qrNumber,
        road,
        side,
        landmark,
        lat,
        lng,
        model,
        installed,
        commissioned,
        status,
        photo,
        remarks,
      }),
    [
      slotLabel,
      slotIdentifier,
      qrNumber,
      road,
      side,
      landmark,
      lat,
      lng,
      model,
      installed,
      commissioned,
      status,
      photo,
      remarks,
    ],
  )

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false
    return JSON.stringify(currentSnapshot) !== JSON.stringify(initialSnapshot)
  }, [isEdit, initialSnapshot, currentSnapshot])

  const crumb = useMemo(
    () => (
      <>
        <Link to="/devices">Devices</Link> › {isEdit ? 'Edit device' : 'New device'}
      </>
    ),
    [isEdit],
  )

  /** Edit Cancel → device detail; Add Cancel → device list. */
  function handleCancel() {
    if (isEdit && editId) {
      navigate(`/devices/${encodeURIComponent(editId)}`, { replace: true })
      return
    }
    navigate('/devices')
  }

  function roadIdForName(name) {
    const row = roads.find((r) => r.name === name)
    return row?.id || null
  }

  /** Build PATCH body with only changed fields (createSchema.partial). */
  function buildPatchBody() {
    if (!initialSnapshot) return null
    const body = {}
    const cur = currentSnapshot
    const prev = initialSnapshot

    if (cur.road !== prev.road) {
      const roadId = roadIdForName(cur.road)
      if (!roadId) {
        toast('Select a valid parking location.', 'error')
        return null
      }
      body.roadId = roadId
    }
    if (cur.slotLabel !== prev.slotLabel) body.slotNumber = cur.slotLabel.trim()
    if (cur.slotIdentifier !== prev.slotIdentifier) body.slotIdentifier = cur.slotIdentifier
    if (cur.qrNumber !== prev.qrNumber) body.qrNumber = cur.qrNumber.trim()
    if (cur.side !== prev.side) body.sideOfRoad = cur.side
    if (cur.landmark !== prev.landmark) body.landmark = cur.landmark
    if (cur.lat !== prev.lat) body.latitude = cur.lat
    if (cur.lng !== prev.lng) body.longitude = cur.lng
    if (cur.model !== prev.model) body.model = cur.model
    if (cur.installed !== prev.installed) body.installedOn = cur.installed
    if (cur.commissioned !== prev.commissioned) body.commissionedOn = cur.commissioned
    if (cur.status !== prev.status) body.installStatus = cur.status
    if (cur.photo !== prev.photo) body.photoUrl = cur.photo
    if (cur.remarks !== prev.remarks) body.remarks = cur.remarks

    return body
  }

  async function handleSubmit(e, mode) {
    e.preventDefault()
    if (loadingEdit || saving) return

    if (isEdit) {
      if (!isDirty || !editId) return
      const body = buildPatchBody()
      if (!body || !Object.keys(body).length) return

      setSaving(true)
      try {
        const { message } = await updateDevice(editId, body)
        toastApiSuccess(message)
        navigate(`/devices/${encodeURIComponent(editId)}`, { replace: true })
      } catch (err) {
        toastApiError(err, 'Could not update device.')
      } finally {
        setSaving(false)
      }
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

  const saveDisabled = loadingEdit || saving || (isEdit && !isDirty)

  return (
    <>
      <PageMeta
        pageId="device-add"
        title={isEdit ? 'Edit device' : 'Add device'}
        crumb={crumb}
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
                hint={
                  isEdit
                    ? 'Slot Id cannot be changed after the device is created.'
                    : 'Primary identity after Device Sync. Used on ticket list and device history.'
                }
              >
                <input
                  type="text"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  placeholder="e.g. 10428"
                  disabled={isEdit || loadingEdit || saving}
                  readOnly={isEdit}
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
                  disabled={loadingEdit || saving}
                />
              </Field>
              <Field
                label="MAC address"
                hint="Hardware MAC from Device Sync (stored as slot identifier)."
              >
                <input
                  type="text"
                  value={slotIdentifier}
                  onChange={(e) => setSlotIdentifier(e.target.value)}
                  placeholder="e.g. AA:BB:CC:DD:EE:FF"
                  disabled={loadingEdit || saving}
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
                  disabled={loadingEdit || saving}
                />
              </Field>
              <Field label="Model">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingEdit || saving}
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
                  disabled={loadingEdit || saving}
                >
                  <option value="">Select parking location</option>
                  {roadOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Side of road">
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  disabled={loadingEdit || saving}
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
                  disabled={loadingEdit || saving}
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="23.0225"
                  disabled={loadingEdit || saving}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="72.5714"
                  disabled={loadingEdit || saving}
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
                    disabled={loadingEdit || saving}
                  />
                </Field>
                <Field label="Commissioned on">
                  <input
                    type="date"
                    value={commissioned}
                    onChange={(e) => setCommissioned(e.target.value)}
                    disabled={loadingEdit || saving}
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
                    disabled={loadingEdit || saving}
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
                    disabled={loadingEdit || saving}
                  />
                </Field>
                <Field label="Remarks" className="span-2">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Site conditions worth recording — waterlogging point, tight slot, heavy two-wheeler entry, and so on."
                    disabled={loadingEdit || saving}
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={saveDisabled} aria-busy={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Save device'}
              </Button>
              {!isEdit ? (
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'another')}
                  disabled={loadingEdit || saving}
                >
                  Save and add another
                </Button>
              ) : null}
              <div className="right">
                <Button type="button" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </section>
        </form>
      </main>
    </>
  )
}
