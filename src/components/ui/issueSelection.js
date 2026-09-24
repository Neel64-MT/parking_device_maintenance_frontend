/**
 * Map multi category/sub selection to BE `issues[]` pairs.
 * Each selected sub must belong to a selected category when categories are chosen;
 * otherwise parent is resolved from the categories tree.
 * @param {{ id: string, name: string, subs?: { id: string, name: string }[] }[]} categories
 * @param {string[]} categoryIds
 * @param {string[]} subCategoryIds
 * @returns {{ categoryId: string, subCategoryId: string }[]}
 */
export function selectionToIssues(categories, categoryIds, subCategoryIds) {
  const cats = Array.isArray(categories) ? categories : []
  const catSet = new Set(Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : [])
  const subIds = Array.isArray(subCategoryIds) ? [...new Set(subCategoryIds.filter(Boolean))] : []
  const out = []
  const seen = new Set()

  for (const subId of subIds) {
    let parent = null
    for (const c of cats) {
      if (catSet.size && !catSet.has(c.id)) continue
      if ((c.subs || []).some((s) => s.id === subId)) {
        parent = c
        break
      }
    }
    if (!parent) {
      for (const c of cats) {
        if ((c.subs || []).some((s) => s.id === subId)) {
          parent = c
          break
        }
      }
    }
    if (!parent || seen.has(subId)) continue
    seen.add(subId)
    out.push({ categoryId: parent.id, subCategoryId: subId })
  }
  return out
}
