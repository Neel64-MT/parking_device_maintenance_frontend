import { useState } from 'react'
import { Button } from '../ui/Button'
import { Pill } from '../ui/Pill'
import { TicketIssueRows } from './TicketIssueRows'
import { groupIssuesForResolve, newIssueRow } from './ticketIssueRowsHelpers'

/**
 * Add Update → Reported Issues. Shows only the work left: every raised issue still Open, one
 * collapsible panel per Main Issue (category) with its Open Sub Issues, all expanded initially.
 * - Ticking a Main Issue selects every Open sub issue under it (sent as `resolveCategoryIds`).
 * - Tapping a Sub Issue selects only that one (sent as `resolveIssueIds`).
 * - Resolved sub issues and fully resolved main issues are hidden (work history keeps them).
 * - "Add another issue" opens `TicketIssueRows` (category → sub-category) to add NEW issues to
 *   the ticket (`addIssues`).
 *
 * Selection and new-issue rows are owned by the parent form; remount (via `key`) to reset.
 */
export function TicketResolveIssues({
  issues,
  selection,
  onSelectionChange,
  addRows,
  onAddRowsChange,
  categories,
  categoriesLoading = false,
  disabled = false,
}) {
  const allGroups = groupIssuesForResolve(issues)
  const groups = allGroups
    .filter((g) => !g.resolved)
    .map((g) => ({ ...g, subs: g.subs.filter((s) => s.status === 'Open') }))
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [adding, setAdding] = useState(false)

  const categoryIds = selection?.categoryIds || []
  const issueIds = selection?.issueIds || []

  function toggleExpanded(categoryId) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  function toggleMainIssue(group) {
    if (disabled || group.resolved) return
    const on = categoryIds.includes(group.categoryId)
    onSelectionChange({
      categoryIds: on
        ? categoryIds.filter((id) => id !== group.categoryId)
        : [...categoryIds, group.categoryId],
      // The main issue covers its subs, so individual picks under it are dropped.
      issueIds: issueIds.filter((id) => !group.subs.some((s) => s.id === id)),
    })
  }

  function toggleSubIssue(group, sub) {
    if (disabled || sub.status !== 'Open' || categoryIds.includes(group.categoryId)) return
    onSelectionChange({
      categoryIds,
      issueIds: issueIds.includes(sub.id)
        ? issueIds.filter((id) => id !== sub.id)
        : [...issueIds, sub.id],
    })
  }

  function cancelAdding() {
    setAdding(false)
    onAddRowsChange([newIssueRow()])
  }

  return (
    <div className="resolve-issues">
      {!groups.length ? (
        <p className="muted" style={{ margin: 0 }}>
          {allGroups.length
            ? 'Every raised issue is already resolved. Use Add another issue if you found a new problem.'
            : 'No issues were raised on this ticket.'}
        </p>
      ) : null}

      {groups.map((group, index) => {
        const open = !collapsed.has(group.categoryId)
        const mainOn = group.resolved || categoryIds.includes(group.categoryId)
        const bodyId = `resolve-issue-${group.categoryId}`
        return (
          <div key={group.categoryId} className={`issue-panel${open ? ' open' : ''}`}>
            <button
              type="button"
              className="issue-panel-toggle"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => toggleExpanded(group.categoryId)}
            >
              <span>
                Issue {index + 1} · {group.category}
              </span>
              <Pill tone={group.resolved ? 'ok' : 'bad'}>
                {group.resolved ? 'Resolved' : `${group.openIds.length} open`}
              </Pill>
              <span className="chev" aria-hidden="true" />
            </button>
            <div className="issue-panel-body" id={bodyId}>
              <label className={`issue-main-check${group.resolved || disabled ? ' is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={mainOn}
                  disabled={disabled || group.resolved}
                  onChange={() => toggleMainIssue(group)}
                />
                <span>
                  <b>Main issue:</b> {group.category}
                  <span className="muted">
                    {group.resolved
                      ? ' — already resolved'
                      : ` — resolves all ${group.openIds.length} open sub issue${group.openIds.length === 1 ? '' : 's'}`}
                  </span>
                </span>
              </label>
              <div className="chip-row" role="group" aria-label={`Sub issues of ${group.category}`}>
                {group.subs.map((sub) => {
                  const resolved = sub.status !== 'Open'
                  const on = !resolved && (categoryIds.includes(group.categoryId) || issueIds.includes(sub.id))
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      className={`chip${on ? ' on' : ''}${resolved ? ' is-resolved' : ''}`}
                      disabled={disabled || resolved || categoryIds.includes(group.categoryId)}
                      aria-pressed={on}
                      onClick={() => toggleSubIssue(group, sub)}
                    >
                      {sub.label}
                      {resolved ? ' · Resolved' : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {adding ? (
        <div className="resolve-issues-add">
          <div className="resolve-issues-add-head">
            <span>
              <b>New issues</b>
              <span className="muted"> — added to this ticket as Open</span>
            </span>
            <Button type="button" size="sm" disabled={disabled} onClick={cancelAdding}>
              Remove
            </Button>
          </div>
          {categoriesLoading ? (
            <p className="muted">Loading issue categories…</p>
          ) : (
            <TicketIssueRows
              rows={addRows}
              onChange={onAddRowsChange}
              categories={categories}
              disabled={disabled}
              minRows={1}
              categoryLabel="Select issue category"
              addLabel="Add another issue"
            />
          )}
        </div>
      ) : null}

      {!adding ? (
        <div className="resolve-issues-actions">
          <Button type="button" size="sm" disabled={disabled} onClick={() => setAdding(true)}>
            Add another issue
          </Button>
        </div>
      ) : null}
    </div>
  )
}
