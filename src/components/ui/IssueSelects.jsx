import { ISSUE_MASTER, issueCategory } from '../../data/issueMaster'
import { Field } from './FilterBar'

/**
 * Cascading category → sub-category selects.
 * Pass `categories` (API shape with UUID ids) for Raise; otherwise mock ISSUE_MASTER by name.
 *
 * @param {{
 *   category: string,
 *   subCategory: string,
 *   onCategoryChange: (value: string) => void,
 *   onSubCategoryChange: (value: string) => void,
 *   categoryLabel?: string,
 *   subLabel?: string,
 *   categoryId?: string,
 *   subId?: string,
 *   categories?: { id: string, name: string, subs?: { id: string, name: string }[] }[],
 *   disabled?: boolean,
 * }} props
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
  categories,
  disabled = false,
}) {
  const live = Array.isArray(categories)
  const catList = live ? categories : ISSUE_MASTER
  const cat = live
    ? catList.find((c) => c.id === category)
    : issueCategory(category)
  const subs = live ? cat?.subs ?? [] : cat?.subs ?? []

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
          disabled={disabled}
        >
          <option value="">Select category</option>
          {catList.map((c) => {
            const value = live ? c.id : c.name
            const key = live ? c.id : c.name
            return (
              <option key={key} value={value}>
                {c.name}
              </option>
            )
          })}
        </select>
      </Field>
      <Field label={subLabel}>
        <select
          id={subId}
          value={subCategory}
          onChange={(e) => onSubCategoryChange(e.target.value)}
          disabled={disabled || !category}
        >
          <option value="">
            {category ? 'Select sub-category' : 'Select a category first'}
          </option>
          {subs.map((s) => {
            const value = live ? s.id : s.name
            const key = live ? s.id : s.name
            return (
              <option key={key} value={value}>
                {s.name}
              </option>
            )
          })}
        </select>
      </Field>
    </>
  )
}
