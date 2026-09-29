import { Button } from '../ui/Button'
import { Field } from '../ui/FilterBar'
import {
  categoriesAvailableForRow,
  categoryById,
  newIssueRow,
} from './ticketIssueRowsHelpers'

/**
 * Multi-issue UI: one category per row, multiple sub-categories as chips.
 * Categories already used on other rows are hidden from this row's category list.
 */
export function TicketIssueRows({
  rows,
  onChange,
  categories,
  disabled = false,
  minRows = 1,
  categoryLabel = 'Issue category',
  subLabel = 'Sub-category',
  addLabel = 'Add another issue',
}) {
  const categoryList = Array.isArray(categories) ? categories : []
  const usedCategoryIds = new Set(rows.map((r) => r.categoryId).filter(Boolean))
  const hasEmptyRow = rows.some((r) => !r.categoryId)
  const canAddMore = !hasEmptyRow && usedCategoryIds.size < categoryList.length

  function updateRow(key, patch) {
    onChange((prev) => {
      const list = Array.isArray(prev) ? prev : rows
      return list.map((r) => (r.key === key ? { ...r, ...patch } : r))
    })
  }

  function addRow() {
    if (!canAddMore) return
    onChange((prev) => {
      const list = Array.isArray(prev) ? prev : rows
      return [...list, newIssueRow()]
    })
  }

  function removeRow(key) {
    onChange((prev) => {
      const list = Array.isArray(prev) ? prev : rows
      if (list.length <= minRows) return list
      return list.filter((r) => r.key !== key)
    })
  }

  function toggleSub(row, subId) {
    if (disabled || !row.categoryId) return
    const current = Array.isArray(row.subCategoryIds) ? row.subCategoryIds : []
    const next = current.includes(subId)
      ? current.filter((id) => id !== subId)
      : [...current, subId]
    updateRow(row.key, { subCategoryIds: next })
  }

  return (
    <div className="ticket-issue-rows">
      {rows.map((row, index) => {
        const availableCats = categoriesAvailableForRow(row, rows, categoryList)
        const cat = categoryById(categoryList, row.categoryId)
        const subs = cat?.subs || []
        const selected = new Set(row.subCategoryIds || [])

        return (
          <div key={row.key} className="ticket-issue-row">
            <div className="ticket-issue-row-head">
              <span className="muted">Issue {index + 1}</span>
              {rows.length > minRows ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled}
                  onClick={() => removeRow(row.key)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="row">
              <Field label={categoryLabel}>
                <select
                  value={row.categoryId}
                  disabled={disabled}
                  onChange={(e) =>
                    updateRow(row.key, {
                      categoryId: e.target.value,
                      subCategoryIds: [],
                    })
                  }
                >
                  <option value="">Select category</option>
                  {availableCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={subLabel}
                hint={
                  row.categoryId
                    ? 'Tap every sub-category that applies for this category.'
                    : undefined
                }
              >
                {!row.categoryId ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Select a category first
                  </p>
                ) : !subs.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No sub-categories for this category
                  </p>
                ) : (
                  <div className="chip-row" role="group" aria-label={subLabel}>
                    {subs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`chip${selected.has(s.id) ? ' on' : ''}`}
                        disabled={disabled}
                        aria-pressed={selected.has(s.id)}
                        onClick={() => toggleSub(row, s.id)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </div>
        )
      })}
      <div className="ticket-issue-rows-actions">
        <Button type="button" size="sm" disabled={disabled || !canAddMore} onClick={addRow}>
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
