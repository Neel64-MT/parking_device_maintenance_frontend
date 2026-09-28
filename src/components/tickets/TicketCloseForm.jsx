import { useEffect, useMemo, useRef, useState } from 'react'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { listIssueCategories } from '../../services/issues'
import { listParts, sumSelectedPartsAmount } from '../../services/parts'
import { closeTicket } from '../../services/tickets'
import { uploadImages } from '../../services/uploads'
import { Button } from '../ui/Button'
import { Field } from '../ui/FilterBar'
import { PartChips } from '../ui/PartChips'
import { PhotoPicker } from '../ui/PhotoPicker'
import { TicketIssueRows } from './TicketIssueRows'
import {
  hasDuplicateSubCategories,
  hasIncompleteIssueRows,
  issuesToRows,
  rowsToIssuePairs,
} from './ticketIssueRowsHelpers'

/** The only device-test option the backend rejects (400 NOT_TESTED). */
const NOT_TESTED = 'Not tested — keep the ticket open'

const DEVICE_TESTED_OPTIONS = [
  'Yes, tested with 5 open-close cycles',
  'Yes, tested with a live transaction',
  NOT_TESTED,
]

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

/**
 * Shared Close ticket form.
 * Submit order: upload photos → close (photos ride along in the close payload).
 * Issue rows start from the ticket's reported issues so the engineer confirms or corrects.
 */
export function TicketCloseForm({
  ticketId,
  reportedIssues = [],
  formClassName = 'modal-update-form',
  formId,
  hideActions = false,
  onCancel,
  onSuccess,
  onBusyChange,
}) {
  // Confirmed issue defaults to what was reported on the ticket.
  const [issueRows, setIssueRows] = useState(() => issuesToRows(reportedIssues))
  const [workDone, setWorkDone] = useState('')
  const [partsChanged, setPartsChanged] = useState(false)
  const [partIds, setPartIds] = useState([])
  const [labour, setLabour] = useState('')
  const [photos, setPhotos] = useState([])
  const [deviceTested, setDeviceTested] = useState(DEVICE_TESTED_OPTIONS[0])
  const [workDoneError, setWorkDoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const workDoneRef = useRef(null)

  const [issueCategories, setIssueCategories] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(true)
  const [partsItems, setPartsItems] = useState([])
  const [partsLoading, setPartsLoading] = useState(true)
  const [partsError, setPartsError] = useState('')

  useEffect(() => {
    let cancelled = false
    // The whole fetch lives inside the deferred callback: a session-cache hit resolves as a
    // microtask, which would otherwise beat the timer and leave the flag stuck on `true`.
    const id = window.setTimeout(() => {
      if (cancelled) return
      setIssuesLoading(true)
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
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [ticketId])

  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      if (cancelled) return
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
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [ticketId])

  const partsCost = sumSelectedPartsAmount(partsItems, partsChanged ? partIds : [])
  const labourValue = labour === '' ? 0 : Number(labour)
  const labourOk = Number.isFinite(labourValue) && labourValue >= 0
  const total = partsCost + (labourOk ? labourValue : 0)

  const reportedLabel = useMemo(() => {
    const first = reportedIssues[0]
    if (!first) return 'No issue was reported'
    const subs = reportedIssues.map((i) => i.sub).filter(Boolean)
    return [first.category, subs.join(', ')].filter(Boolean).join(' › ')
  }, [reportedIssues])

  function changePartsChanged(next) {
    setPartsChanged(next)
    if (!next) {
      setPartIds([])
      setLabour('')
    }
  }

  function changeLabour(raw) {
    const value = String(raw ?? '')
    if (value === '') {
      setLabour('')
      return
    }
    // Digits only. A "-", "." or "e" is rejected outright rather than stripped, so the
    // box never silently rewrites what was typed (e.g. "1e5" must not become "15").
    if (!/^\d+$/.test(value)) return
    // Collapse leading zeros so a cost of 007 is stored as 7.
    setLabour(String(Number(value)))
  }

  async function submitClose(e) {
    e.preventDefault()
    if (!ticketId || submitting) return

    const issues = rowsToIssuePairs(issueRows)
    if (!issues.length) {
      toast('Confirm the issue found before closing.', 'error')
      return
    }
    if (hasIncompleteIssueRows(issueRows)) {
      toast('Select at least one sub-category for each chosen category.', 'error')
      return
    }
    if (hasDuplicateSubCategories(issueRows)) {
      toast('Each issue can only be selected once.', 'error')
      return
    }
    if (!workDone.trim()) {
      toast('Describe the work done before closing.', 'error')
      setWorkDoneError('Describe the work done before closing.')
      workDoneRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      workDoneRef.current?.focus()
      return
    }
    if (deviceTested === NOT_TESTED) {
      toast('Test the device before closing, or leave the ticket open with an update.', 'error')
      return
    }
    if (!labourOk) {
      toast('Labour must be zero or more.', 'error')
      return
    }

    setSubmitting(true)
    onBusyChange?.(true)
    try {
      // The close endpoint has no separate photo-attach step, so upload first and
      // pass the resulting URLs in the same payload.
      let photoUrls = []
      if (photos.length) {
        const uploaded = await uploadImages(photos)
        photoUrls = uploaded.map((u) => u.url).filter(Boolean)
        if (!photoUrls.length) {
          throw new ApiRequestError('Photos were selected but the upload returned no URLs.', {
            status: 500,
          })
        }
      }

      const saved = await closeTicket(ticketId, {
        issues,
        workDone: workDone.trim(),
        parts: partsChanged ? [...new Set(partIds)] : [],
        photos: photoUrls,
        cost: labourOk ? labourValue : 0,
        deviceTested,
      })

      const closeCost = Number(saved?.cost)
      toastApiSuccess(
        Number.isFinite(closeCost)
          ? `Ticket closed. Visit cost ${formatMoney(closeCost)}.`
          : 'Ticket closed.',
      )
      onSuccess?.(saved)
    } catch (err) {
      toastApiError(err, 'Could not close ticket.')
    } finally {
      setSubmitting(false)
      onBusyChange?.(false)
    }
  }

  function handleCancel() {
    if (submitting) return
    onCancel?.()
  }

  return (
    <form id={formId} className={formClassName} onSubmit={submitClose}>
      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: '0 0 2px' }}>Confirmed issue</h4>
        <p className="muted" style={{ margin: '0 0 10px' }}>
          This is what the reports will count. Reported: {reportedLabel}.
        </p>
        {issuesLoading ? (
          <p className="muted">Loading issue categories…</p>
        ) : (
          <TicketIssueRows
            rows={issueRows}
            onChange={setIssueRows}
            categories={issueCategories}
            disabled={submitting}
            categoryLabel="Issue category"
            subLabel="Sub-category"
            addLabel="Add another issue"
          />
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <Field
          label="Parts were changed"
          hint="Select Yes if a part was replaced while closing this ticket."
        >
          <div className="update-parts-choice">
            {[
              ['Yes', true],
              ['No', false],
            ].map(([labelText, value]) => (
              <label
                key={labelText}
                className={`update-parts-choice-option${partsChanged === value ? ' is-selected' : ''}${submitting ? ' is-disabled' : ''}`}
              >
                <input
                  type="radio"
                  checked={partsChanged === value}
                  onChange={() => changePartsChanged(value)}
                  disabled={submitting}
                  aria-label={`Parts were changed: ${labelText}`}
                />
                <span>{labelText}</span>
              </label>
            ))}
          </div>
        </Field>
        {partsChanged ? (
          <>
            <Field
              label="Parts changed on this ticket"
              hint="Tap every part you replaced. Leave blank if nothing was changed."
              style={{ marginTop: 12 }}
            >
              <PartChips
                items={partsItems}
                selected={partIds}
                onChange={(next) => setPartIds([...next])}
                loading={partsLoading}
                error={partsError}
                disabled={submitting}
                searchable
              />
            </Field>
            <Field
              label="Labour / other charges"
              hint="Part prices come from Parts Master and are added by the server."
              style={{ marginTop: 12 }}
            >
              <input
                type="text"
                className="amount-input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={labour}
                disabled={submitting}
                onChange={(e) => changeLabour(e.target.value)}
                placeholder="0"
              />
            </Field>
          </>
        ) : null}
        <Field label="Photos" style={{ marginTop: 12 }}>
          <PhotoPicker
            hint="Up to 5 photos of the repaired device — the work, the device, the site."
            onChange={setPhotos}
            disabled={submitting}
          />
        </Field>
      </div>

      <div style={{ marginTop: 12 }}>
        <Field
          label="Cost summary"
          hint="Display only. The server calculates the final visit cost."
        >
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>Parts</td>
                  <td className="num">{formatMoney(partsCost)}</td>
                </tr>
                <tr>
                  <td>Labour / other charges</td>
                  <td className="num">{formatMoney(labourOk ? labourValue : 0)}</td>
                </tr>
                <tr>
                  <td>
                    <b>Total for this visit</b>
                  </td>
                  <td className="num">
                    <b>{formatMoney(total)}</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Field>
      </div>

      <div style={{ marginTop: 12 }}>
        <Field
          label="Device tested and working"
          hint="Closing puts the device back to working. If the fault reopens within 7 days it comes back as the same ticket, not a new one."
        >
          <select
            value={deviceTested}
            disabled={submitting}
            onChange={(e) => setDeviceTested(e.target.value)}
          >
            {DEVICE_TESTED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Work done is last: it is the one required free-text field, so it reads as the
          final thing to confirm before the submit bar. */}
      <div style={{ marginTop: 12 }}>
        <Field
          label="Work done"
          hint="Written once, read every time this device comes up again."
          error={workDoneError}
          errorId="work-done-error"
        >
          <textarea
            ref={workDoneRef}
            value={workDone}
            disabled={submitting}
            aria-invalid={workDoneError ? 'true' : undefined}
            aria-describedby={workDoneError ? 'work-done-error' : undefined}
            className={workDoneError ? 'is-invalid' : undefined}
            onChange={(e) => {
              setWorkDone(e.target.value)
              if (workDoneError && e.target.value.trim()) setWorkDoneError('')
            }}
            placeholder="e.g. Replaced motor and gearbox assembly, reset travel limits, tested 5 open-close cycles."
          />
        </Field>
      </div>

      {hideActions ? null : (
        <div className="row" style={{ marginTop: 14 }}>
          <Button type="button" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Closing…' : 'Close ticket'}
          </Button>
        </div>
      )}
    </form>
  )
}
