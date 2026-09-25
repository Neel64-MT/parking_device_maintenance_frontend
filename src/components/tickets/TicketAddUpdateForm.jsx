import { useEffect, useState } from 'react'
import { TEAM } from '../../data/team'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { listIssueCategories } from '../../services/issues'
import { listParts, sumSelectedPartsAmount } from '../../services/parts'
import { addTicketUpdate, attachTicketUpdatePhotos } from '../../services/tickets'
import { uploadImages } from '../../services/uploads'
import {
  hasDuplicateSubCategories,
  hasIncompleteIssueRows,
  newIssueRow,
  rowsToIssuePairs,
} from './ticketIssueRowsHelpers'
import { TicketIssueRows } from './TicketIssueRows'
import { Button } from '../ui/Button'
import { Field } from '../ui/FilterBar'
import { PartChips } from '../ui/PartChips'
import { PhotoPicker } from '../ui/PhotoPicker'

/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
function todayLocalIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

/**
 * Shared Add Update form (Detail modal + /tickets/update page).
 * Submit order: update → upload photos → attach URLs.
 * Issue rows intentionally start blank; the user selects the category and sub-category.
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
  const [issueRows, setIssueRows] = useState(() => [newIssueRow()])
  const [updPhotos, setUpdPhotos] = useState([])
  const [updWorkDone, setUpdWorkDone] = useState('')
  const [updCost, setUpdCost] = useState('')
  const [updPartIds, setUpdPartIds] = useState([])
  const [updPartsChanged, setUpdPartsChanged] = useState(false)
  const [updVisitedBy, setUpdVisitedBy] = useState(() => (pickVisitedBy ? '' : user?.name || ''))
  const [updSubmitting, setUpdSubmitting] = useState(false)
  const [partsItems, setPartsItems] = useState([])
  const [partsLoading, setPartsLoading] = useState(true)
  const [partsError, setPartsError] = useState('')
  const [issueCategories, setIssueCategories] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(true)

  function resetUpdateForm() {
    setUpdType('Site visit — not resolved')
    setIssueRows([newIssueRow()])
    setUpdPhotos([])
    setUpdWorkDone('')
    setUpdCost('')
    setUpdPartIds([])
    setUpdPartsChanged(false)
    setUpdVisitedBy(pickVisitedBy ? '' : user?.name || '')
  }

  function changePartsChanged(nextValue) {
    setUpdPartsChanged(nextValue)
    if (!nextValue) {
      setUpdPartIds([])
      setUpdCost('')
    }
  }

  function changeLabourCost(value) {
    if (value === '') {
      setUpdCost('')
      return
    }
    const numeric = Number(value)
    if (Number.isFinite(numeric) && numeric >= 0) setUpdCost(value)
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIssueRows([newIssueRow()])
    }, 0)
    return () => window.clearTimeout(id)
  }, [ticketId])

  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      if (!cancelled) setPartsLoading(true)
    }, 0)
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
      window.clearTimeout(id)
    }
  }, [ticketId])

  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      if (!cancelled) setIssuesLoading(true)
    }, 0)
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
      window.clearTimeout(id)
    }
  }, [ticketId])

  const partsHintTotal = sumSelectedPartsAmount(partsItems, updPartIds)
  const labourHint =
    updPartsChanged && updCost !== '' && Number.isFinite(Number(updCost))
      ? Math.max(0, Number(updCost))
      : 0
  const visitHintTotal = partsHintTotal + labourHint
  const hasCostSummary = updPartIds.length > 0 || labourHint > 0

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

    const issues = rowsToIssuePairs(issueRows)
    if (hasIncompleteIssueRows(issueRows)) {
      toast('Select at least one sub-category for each chosen category.', 'error')
      return
    }
    if (hasDuplicateSubCategories(issueRows)) {
      toast('Each issue can only be selected once.', 'error')
      return
    }

    setUpdSubmitting(true)
    onBusyChange?.(true)
    try {
      const body = {
        updateType: updType,
        workDone: updWorkDone.trim() || undefined,
        cost: labourHint,
        parts: updPartsChanged ? [...new Set(updPartIds)] : [],
        photos: [],
      }
      if (issues.length) {
        body.issues = issues
      }

      const saved = await addTicketUpdate(ticketId, body)

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
          <input
            type="date"
            defaultValue={todayLocalIso()}
            max={todayLocalIso()}
            disabled={updSubmitting}
          />
        </Field>
      </div>

      <div style={{ marginTop: 12 }}>
        {issuesLoading ? (
          <p className="muted">Loading issue categories…</p>
        ) : (
          <TicketIssueRows
            rows={issueRows}
            onChange={setIssueRows}
            categories={issueCategories}
            disabled={updSubmitting}
            minRows={1}
            categoryLabel="Select issue category"
            addLabel="Add another issue"
          />
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Field
          label="Parts were changed"
          hint="Select Yes if a part was replaced during this visit."
        >
          <div className="update-parts-choice">
            <label
              className={`update-parts-choice-option${updPartsChanged ? ' is-selected' : ''}${updSubmitting ? ' is-disabled' : ''}`}
            >
              <input
                type="radio"
                checked={updPartsChanged}
                onChange={() => changePartsChanged(true)}
                disabled={updSubmitting}
                aria-label="Parts were changed: Yes"
              />
              <span>Yes</span>
            </label>
          </div>
        </Field>
      </div>

      {updPartsChanged ? (
        <>
          <div style={{ marginTop: 12 }}>
            <Field
              label="Select parts"
              hint="Search and select every part you replaced during this visit."
            >
              <PartChips
                searchable
                items={partsItems}
                selected={updPartIds}
                onChange={setUpdPartIds}
                loading={partsLoading}
                error={partsError}
                disabled={updSubmitting}
              />
            </Field>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <Field
              label="Labour / other charges"
              hintAfter="Part prices come from Parts and are added by the server."
            >
              <input
                type="number"
                placeholder="0"
                value={updCost}
                onChange={(e) => changeLabourCost(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                min="0"
                step="0.01"
                disabled={updSubmitting}
              />
            </Field>
          </div>

          {hasCostSummary ? (
            <div className="visit-cost-summary" aria-live="polite">
              <div className="visit-cost-summary-head">
                <strong>Cost summary</strong>
                <span>Display only. Server calculates the final visit cost.</span>
              </div>
              {updPartIds.length > 0 ? (
                <div className="visit-cost-row">
                  <span>Parts Total</span>
                  <strong>{formatMoney(partsHintTotal)}</strong>
                </div>
              ) : null}
              {labourHint > 0 ? (
                <div className="visit-cost-row">
                  <span>Labour / other charges</span>
                  <strong>{formatMoney(labourHint)}</strong>
                </div>
              ) : null}
              <div className="visit-cost-row visit-cost-total">
                <span>Total Amount</span>
                <strong>{formatMoney(visitHintTotal)}</strong>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
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
