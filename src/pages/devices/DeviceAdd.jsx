import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { createDevice, getDevice, updateDevice } from '../../services/devices'
import { listRoadLookups } from '../../services/roads'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'

/** Form → snapshot of the five editable values (Slot Id is identity, tracked separately). */
function snapshotFromForm(values) {
  return {
    slotLabel: values.slotLabel,
    slotIdentifier: values.slotIdentifier,
    qrNumber: values.qrNumber,
    roadId: values.roadId,
  }
}

const EMPTY_ERRORS = { slotId: '', slotLabel: '', qrNumber: '', roadId: '' }

export default function DeviceAdd() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id') || ''
  const isEdit = Boolean(editId)

  const [slotId, setSlotId] = useState('')
  const [slotLabel, setSlotLabel] = useState('')
  const [slotIdentifier, setSlotIdentifier] = useState('')
  const [qrNumber, setQrNumber] = useState('')
  const [roadId, setRoadId] = useState('')
  const [roads, setRoads] = useState([])
  const [roadsLoading, setRoadsLoading] = useState(true)
  const [roadsError, setRoadsError] = useState(false)
  const [errors, setErrors] = useState(EMPTY_ERRORS)
  const [loadingEdit, setLoadingEdit] = useState(() => Boolean(editId))
  const [loadError, setLoadError] = useState('')
  const [initialSnapshot, setInitialSnapshot] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    listRoadLookups()
      .then((rows) => {
        if (cancelled) return
        setRoads(Array.isArray(rows) ? rows : [])
        setRoadsError(false)
      })
      .catch(() => {
        if (cancelled) return
        setRoadsError(true)
        toast('Could not load parking locations. Try again.', 'error')
      })
      .finally(() => {
        if (!cancelled) setRoadsLoading(false)
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

        const next = {
          slotId:
            h.slotId != null && h.slotId !== ''
              ? String(h.slotId)
              : h.publicId || (h.id != null ? String(h.id) : ''),
          slotLabel: h.slotLabel || h.slot || '',
          slotIdentifier: h.slotIdentifier || '',
          qrNumber: h.qrNumber || h.qr || '',
          roadId: h.roadId || '',
        }

        setSlotId(next.slotId)
        setSlotLabel(next.slotLabel)
        setSlotIdentifier(next.slotIdentifier)
        setQrNumber(next.qrNumber)
        setRoadId(next.roadId)
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
    () => snapshotFromForm({ slotLabel, slotIdentifier, qrNumber, roadId }),
    [slotLabel, slotIdentifier, qrNumber, roadId],
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

  /** Validate the required fields. Slot Id is skipped in edit (identity is read-only). */
  function validate() {
    const next = { ...EMPTY_ERRORS }
    if (!isEdit && !slotId.trim()) next.slotId = 'Slot Id is required.'
    if (!slotLabel.trim()) next.slotLabel = 'Slot Label is required.'
    if (!qrNumber.trim()) next.qrNumber = 'QR Number is required.'
    if (!roadId) next.roadId = 'Select a parking location.'
    setErrors(next)
    return !next.slotId && !next.slotLabel && !next.qrNumber && !next.roadId
  }

  /** PATCH body with only changed fields (createSchema.partial). Slot Id is immutable. */
  function buildPatchBody() {
    if (!initialSnapshot) return null
    const body = {}
    const cur = currentSnapshot
    const prev = initialSnapshot
    if (cur.roadId !== prev.roadId) body.roadId = cur.roadId
    if (cur.slotLabel.trim() !== prev.slotLabel.trim()) body.slotNumber = cur.slotLabel.trim()
    if (cur.slotIdentifier.trim() !== prev.slotIdentifier.trim())
      body.slotIdentifier = cur.slotIdentifier.trim()
    if (cur.qrNumber.trim() !== prev.qrNumber.trim()) body.qrNumber = cur.qrNumber.trim()
    return body
  }

  function resetForm() {
    setSlotId('')
    setSlotLabel('')
    setSlotIdentifier('')
    setQrNumber('')
    setRoadId('')
    setErrors(EMPTY_ERRORS)
  }

  async function handleSubmit(e, mode) {
    e.preventDefault()
    if (loadingEdit || saving) return

    // Trim all text inputs before validating and saving, and reflect it in the form.
    const trimmedSlotId = slotId.trim()
    const trimmedSlotLabel = slotLabel.trim()
    const trimmedSlotIdentifier = slotIdentifier.trim()
    const trimmedQrNumber = qrNumber.trim()
    if (trimmedSlotId !== slotId) setSlotId(trimmedSlotId)
    if (trimmedSlotLabel !== slotLabel) setSlotLabel(trimmedSlotLabel)
    if (trimmedSlotIdentifier !== slotIdentifier) setSlotIdentifier(trimmedSlotIdentifier)
    if (trimmedQrNumber !== qrNumber) setQrNumber(trimmedQrNumber)

    if (isEdit) {
      if (!validate()) return
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

    if (!validate()) return

    setSaving(true)
    try {
      const { message } = await createDevice({
        slotId: trimmedSlotId,
        slotNumber: trimmedSlotLabel,
        slotIdentifier: trimmedSlotIdentifier || undefined,
        qrNumber: trimmedQrNumber,
        roadId,
      })
      toastApiSuccess(message)
      if (mode === 'another') {
        resetForm()
      } else {
        navigate('/devices')
      }
    } catch (err) {
      toastApiError(err, 'Could not create device.')
    } finally {
      setSaving(false)
    }
  }

  const disabled = loadingEdit || saving
  const saveDisabled = disabled || (isEdit && !isDirty)
  const noRoads = !roadsLoading && !roadsError && roads.length === 0

  return (
    <>
      <PageMeta
        pageId="device-add"
        title={isEdit ? 'Edit Device' : 'Add Device'}
        crumb={crumb}
      />

      <main className="page" style={{ maxWidth: 760 }}>
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
            title="Device"
            subtitle={
              isEdit
                ? 'Update this device’s slot, identifiers, and parking location.'
                : 'Register a new parking device by its Slot Id, labels, and parking location.'
            }
          >
            <div className="form-grid">
              <Field
                label="Slot Id"
                required
                error={errors.slotId}
                errorId="err-slotId"
                hint={
                  isEdit
                    ? 'Slot Id cannot be changed after the device is created.'
                    : 'Identity used on tickets and device history.'
                }
              >
                <input
                  type="text"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  placeholder="e.g. 10428"
                  disabled={isEdit || disabled}
                  readOnly={isEdit}
                  aria-invalid={Boolean(errors.slotId)}
                  aria-describedby={errors.slotId ? 'err-slotId' : undefined}
                />
              </Field>

              <Field
                label="Slot Label"
                required
                error={errors.slotLabel}
                errorId="err-slotLabel"
                hint="Label painted on site (e.g. 3-169)."
              >
                <input
                  type="text"
                  value={slotLabel}
                  onChange={(e) => setSlotLabel(e.target.value)}
                  placeholder="e.g. 3-169"
                  disabled={disabled}
                  aria-invalid={Boolean(errors.slotLabel)}
                  aria-describedby={errors.slotLabel ? 'err-slotLabel' : undefined}
                />
              </Field>

              <Field
                label="MAC Address"
                error=""
                hint="Hardware MAC / slot identifier scanned on site (optional)."
              >
                <input
                  type="text"
                  value={slotIdentifier}
                  onChange={(e) => setSlotIdentifier(e.target.value)}
                  placeholder="e.g. AA:BB:CC:DD:EE:FF"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="QR Number"
                required
                error={errors.qrNumber}
                errorId="err-qrNumber"
                hint="Printed on the machine body (e.g. AMCD5979)."
              >
                <input
                  type="text"
                  value={qrNumber}
                  onChange={(e) => setQrNumber(e.target.value)}
                  placeholder="e.g. AMCD5979"
                  disabled={disabled}
                  aria-invalid={Boolean(errors.qrNumber)}
                  aria-describedby={errors.qrNumber ? 'err-qrNumber' : undefined}
                />
              </Field>

              <Field
                label="Parking Location"
                required
                className="span-2"
                error={errors.roadId || (roadsError ? 'Could not load parking locations.' : '')}
                errorId="err-roadId"
                hint={
                  noRoads
                    ? 'No parking locations yet — add a road first.'
                    : 'Choose the road this device sits on.'
                }
                hintAfter={
                  noRoads ? (
                    <Link to="/masters/roads/add">Add a road</Link>
                  ) : null
                }
              >
                <select
                  value={roadId}
                  onChange={(e) => setRoadId(e.target.value)}
                  disabled={disabled || roadsLoading || roadsError || noRoads}
                  aria-invalid={Boolean(errors.roadId)}
                  aria-describedby={errors.roadId ? 'err-roadId' : undefined}
                >
                  <option value="">
                    {roadsLoading
                      ? 'Loading locations…'
                      : roadsError
                        ? 'Unavailable'
                        : 'Select parking location'}
                  </option>
                  {roads.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={saveDisabled} aria-busy={saving}>
                {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Save Device'}
              </Button>
              {!isEdit ? (
                <Button type="button" onClick={(e) => handleSubmit(e, 'another')} disabled={disabled}>
                  Save and add another
                </Button>
              ) : null}
              <div className="right">
                <Button type="button" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </Panel>
        </form>
      </main>
    </>
  )
}
