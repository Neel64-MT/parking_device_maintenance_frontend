import { ISSUE_MASTER, issueCategory } from '../../data/issueMaster'
import { Field } from './FilterBar'

/**
 * Cascading category → sub-category selects.
 * Ported from asset/app.js bindIssueSelects.
 */
export function IssueSelects({
  category,
  subCategory,
  onCategoryChange,
  onSubCategoryChange,
  categoryLabel = 'Issue category',
  subLabel = 'Sub-category',
  categoryId,
  subId,
}) {
  const cat = issueCategory(category)
  const subs = cat?.subs ?? []

  function handleCat(e) {
    const value = e.target.value
    onCategoryChange(value)
    onSubCategoryChange('')
  }

  return (
    <>
      <Field label={categoryLabel}>
        <select
          id={categoryId}
          value={category}
          onChange={handleCat}
        >
          <option value="">Select category</option>
          {ISSUE_MASTER.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={subLabel}>
        <select
          id={subId}
          value={subCategory}
          onChange={(e) => onSubCategoryChange(e.target.value)}
          disabled={!category}
        >
          <option value="">
            {category ? 'Select sub-category' : 'Select a category first'}
          </option>
          {subs.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
    </>
  )
}
