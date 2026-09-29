let issueRowSeq = 0

export function newIssueRow(partial = {}) {
  issueRowSeq += 1
  return {
    key: `issue-${issueRowSeq}`,
    categoryId: partial.categoryId || '',
    subCategoryIds: Array.isArray(partial.subCategoryIds)
      ? [...partial.subCategoryIds]
      : partial.subCategoryId
        ? [partial.subCategoryId]
        : [],
  }
}

/** Build API `issues[]` — one pair per selected sub under each category row. */
export function rowsToIssuePairs(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const r of rows) {
    if (!r.categoryId || !Array.isArray(r.subCategoryIds)) continue
    for (const subCategoryId of r.subCategoryIds) {
      if (subCategoryId) out.push({ categoryId: r.categoryId, subCategoryId })
    }
  }
  return out
}

/** True when the same subCategoryId appears twice across rows. */
export function hasDuplicateSubCategories(rows) {
  const seen = new Set()
  for (const pair of rowsToIssuePairs(rows)) {
    if (seen.has(pair.subCategoryId)) return true
    seen.add(pair.subCategoryId)
  }
  return false
}

/** True when a row has a category but no sub selected. */
export function hasIncompleteIssueRows(rows) {
  return (rows || []).some(
    (r) => r.categoryId && (!Array.isArray(r.subCategoryIds) || !r.subCategoryIds.length),
  )
}

/**
 * Group API issue pairs into rows: one category + many subs.
 */
export function issuesToRows(issues) {
  if (!Array.isArray(issues) || !issues.length) return [newIssueRow()]
  const byCat = new Map()
  for (const i of issues) {
    const catId = i.categoryId || ''
    const subId = i.subCategoryId || ''
    if (!catId || !subId) continue
    if (!byCat.has(catId)) byCat.set(catId, [])
    const list = byCat.get(catId)
    if (!list.includes(subId)) list.push(subId)
  }
  if (!byCat.size) return [newIssueRow()]
  return [...byCat.entries()].map(([categoryId, subCategoryIds]) =>
    newIssueRow({ categoryId, subCategoryIds }),
  )
}

/**
 * Category options for one row: hide categories already chosen on other rows.
 * Keeps this row's current category so the controlled select stays valid.
 */
export function categoriesAvailableForRow(row, allRows, categories) {
  if (!Array.isArray(categories)) return []
  const taken = new Set(
    (allRows || [])
      .filter((r) => r.key !== row?.key && r.categoryId)
      .map((r) => r.categoryId),
  )
  return categories.filter((cat) => !taken.has(cat.id) || cat.id === row?.categoryId)
}

export function categoryById(categories, categoryId) {
  if (!Array.isArray(categories) || !categoryId) return null
  return categories.find((c) => c.id === categoryId) || null
}

/**
 * Group API/display issues by category for Detail classification.
 * Preserves first-seen category order; subs keep API order within a group.
 * @param {{ categoryId?: string, category?: string, subCategoryId?: string, sub?: string }[]} issues
 * @returns {{ key: string, category: string, subs: { key: string, label: string }[] }[]}
 */
export function groupIssuesForDisplay(issues) {
  if (!Array.isArray(issues) || !issues.length) return []
  const groups = []
  const indexByKey = new Map()
  for (const i of issues) {
    const category = String(i.category || '').trim() || '—'
    const sub = String(i.sub || '').trim() || '—'
    const key = i.categoryId || category
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length)
      groups.push({ key, category, subs: [] })
    }
    const group = groups[indexByKey.get(key)]
    const subKey = i.subCategoryId || `${key}:${sub}:${group.subs.length}`
    group.subs.push({ key: subKey, label: sub })
  }
  return groups
}
