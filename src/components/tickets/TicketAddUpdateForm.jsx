import { useEffect, useState } from 'react'
import { TEAM } from '../../data/team'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { listParts, sumSelectedPartsAmount } from '../../services/parts'
import { addTicketUpdate, attachTicketUpdatePhotos } from '../../services/tickets'
import { uploadImages } from '../../services/uploads'
import { Button } from '../ui/Button'
import { Field } from '../ui/FilterBar'
import { IssueSelects } from '../ui/IssueSelects'
import { PartChips } from '../ui/PartChips'
import { PhotoPicker } from '../ui/PhotoPicker'

/**
 * Shared Add Update form (Detail modal + /tickets/update page).
 * Submit order: update → upload photos → attach URLs.
 */
export function TicketAddUpdateForm({
  ticketId,
  user,
  pickVisitedBy = false,
  formClassName = 'modal-update-form',
  formId,
  photoPickerKey = 'upd-photos',
  showCancel = true,
  hideActions = false,
  onCancel,
  onSuccess,
  onBusyChange,
  canSubmit = true,
}) {
  const [updType, setUpdType] = useState('Site visit — not resolved')
  const [updCat, setUpdCat] = useState('')
  const [updSub, setUpdSub] = useState('')
  const [updPhotos, setUpdPhotos] = useState([])
  const [updWorkDone, setUpdWorkDone] = useState('')
  const [updCost, setUpdCost] = useState('')
  const [updPartIds, setUpdPartIds] = useState([])
  const [updVisitedBy, setUpdVisitedBy] = useState(() => (pickVisitedBy ? '' : user?.name || ''))
  const [updSubmitting, setUpdSubmitting] = useState(false)
  const [partsItems, setPartsItems] = useState([])
  const [partsLoading, setPartsLoading] = useState(true)
  const [partsError, setPartsError] = useState('')

  function resetUpdateForm() {
    setUpdType('Site visit — not resolved')
    setUpdCat('')
    setUpdSub('')
    setUpdPhotos([])
    setUpdWorkDone('')
    setUpdCost('')
    setUpdPartIds([])
    setUpdVisitedBy(pickVisitedBy ? '' : user?.name || '')
  }

  useEffect(() => {
    let cancelled = false
    setPartsLoading(true)
    listParts()
      .then((list) => {
        if (!cancelled) {
          setPartsItems(list)
          setPartsError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPartsItems([])
          setPartsError(err instanceof ApiRequestError ? err.message : 'Could not load parts.')
        }
      })
      .finally(() => {
        if (!cancelled) setPartsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ticketId])

  const partsHintTotal = sumSelectedPartsAmount(partsItems, updPartIds)
  const labourHint = updCost === '' ? 0 : Number(updCost) || 0
  const visitHintTotal = partsHintTotal + labourHint

  async function submitUpdate(e) {
    e.preventDefault()
    if (!ticketId) return
    if (!canSubmit) {
      toast('You do not have permission to add ticket updates.', 'error')
      return
    }
    if (pickVisitedBy && !updVisitedBy.trim()) {
      toast('Select who visited.', 'error')
      return
    }
    setUpdSubmitting(true)
    onBusyChange?.(true)
    try {
      const saved = await addTicketUpdate(ticketId, {
        updateType: updType,
        workDone: updWorkDone.trim() || undefined,
        cost: updCost === '' ? 0 : Number(updCost) || 0,
        parts: [...new Set(updPartIds)],
        photos: [],
      })

      if (updPhotos.length) {
        if (!saved?.eventId) {
          throw new ApiRequestError('Update saved but server did not return an event id for photos.', {
            status: 500,
          })
        }
        const uploaded = await uploadImages(updPhotos)
        const photoUrls = uploaded.map((u) => u.url).filter(Boolean)
        if (!photoUrls.length) {
          throw new ApiRequestError('Update saved but photo upload returned no URLs.', {
            status: 500,
          })
        }
        await attachTicketUpdatePhotos(ticketId, saved.eventId, photoUrls)
      }

      resetUpdateForm()
      const visitCost = saved?.cost != null ? Number(saved.cost) : null
      if (visitCost != null && !Number.isNaN(visitCost)) {
        toastApiSuccess(`Update saved. Visit cost ₹${visitCost.toLocaleString('en-IN')}.`)
      } else {
        toastApiSuccess('Update saved.')
      }
      onSuccess?.(saved)
    } catch (err) {
      toastApiError(err, 'Could not save update.')
    } finally {
      setUpdSubmitting(false)
      onBusyChange?.(false)
    }
  }

  function handleCancel() {
    if (updSubmitting) return
    resetUpdateForm()
    onCancel?.()
  }

  return (
    <form id={formId} className={formClassName} onSubmit={submitUpdate}>
      <div className="row">
        <Field label="Update type">
          <select
            value={updType}
            onChange={(e) => setUpdType(e.target.value)}
            disabled={updSubmitting}
          >
            <option>Site visit — not resolved</option>
            <option>Site visit — resolved</option>
            <option>Remote check</option>
            <option>Waiting for spare</option>
            <option>Waiting for traffic police / AMC</option>
          </select>
        </Field>
        <Field label="Visited by">
          {pickVisitedBy ? (
            <select
              value={updVisitedBy}
              onChange={(e) => setUpdVisitedBy(e.target.value)}
              disabled={updSubmitting}
              required
            >
              <option value="">Select who visited</option>
              {user?.name ? <option value={user.name}>{user.name}</option> : null}
              {TEAM.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <select value={user?.name || ''} disabled>
              <option value={user?.name || ''}>{user?.name || 'Current user'}</option>
            </select>
          )}
        </Field>
        <Field label="Date and time">
          <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} disabled={updSubmitting} />
        </Field>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <IssueSelects
          category={updCat}
          subCategory={updSub}
          onCategoryChange={setUpdCat}
          onSubCategoryChange={setUpdSub}
          categoryLabel="Issue category found"
        />
        <Field
          label="Labour / other charges"
          hintAfter="Part prices come from Parts and are added by the server."
        >
          <input
            type="number"
            placeholder="0"
            value={updCost}
            onChange={(e) => setUpdCost(e.target.value)}
            min="0"
            disabled={updSubmitting}
          />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field
          label="Parts changed"
          hint="Tap every part you replaced. Leave blank if nothing was changed."
        >
          <PartChips
            items={partsItems}
            selected={updPartIds}
            onChange={setUpdPartIds}
            loading={partsLoading}
            error={partsError}
            disabled={updSubmitting}
          />
          {updPartIds.length > 0 ? (
            <div className="parts-total" aria-live="polite">
              <div className="parts-total-meta">
                <strong>Parts total · {updPartIds.length} selected</strong>
                <span>
                  From Parts (display only). Server adds this to labour
                  {labourHint > 0
                    ? ` · est. visit ₹${visitHintTotal.toLocaleString('en-IN')}`
                    : ''}
                  .
                </span>
              </div>
              <div className="parts-total-amount">₹{partsHintTotal.toLocaleString('en-IN')}</div>
            </div>
          ) : null}
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="Photos">
          <PhotoPicker
            key={photoPickerKey}
            hint="Up to 5 photos — the work, the device, the site."
            onChange={setUpdPhotos}
            disabled={updSubmitting}
          />
        </Field>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <Field label="What was done today" className="span-2" style={{ flex: 3 }}>
          <textarea
            style={{ minHeight: 64 }}
            placeholder="Plain description of the work done on this visit, even if nothing was fixed."
            value={updWorkDone}
            onChange={(e) => setUpdWorkDone(e.target.value)}
            disabled={updSubmitting}
          />
        </Field>
      </div>

      <p className="muted modal-update-hint">
        The ticket closes only when the update type is <b>resolved</b>. Everything else keeps it open.
      </p>

      {!hideActions ? (
        <div className="modal-actions modal-update-actions">
          {showCancel ? (
            <Button type="button" size="sm" onClick={handleCancel} disabled={updSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" size="sm" variant="primary" disabled={updSubmitting || !canSubmit}>
            {updSubmitting ? 'Saving…' : 'Save update'}
          </Button>
        </div>
      ) : null}
    </form>
  )
}
