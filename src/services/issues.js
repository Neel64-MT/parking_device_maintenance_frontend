import { api } from './api'

/**
 * @typedef {{ id: string, name: string, severity?: string, active?: boolean, usage90d?: number }} IssueSub
 * @typedef {{ id: string, name: string, active?: boolean, subs: IssueSub[] }} IssueCategory
 */

/** @type {IssueCategory[] | null} */
let cachedCategories = null
/** @type {Promise<IssueCategory[]> | null} */
let inflight = null

function clearIssueCache() {
  cachedCategories = null
  inflight = null
}

/**
 * Issue categories + subs from `GET /api/issues` (Issue master v).
 * Session-cached; pass `{ force: true }` to refetch.
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<IssueCategory[]>}
 */
export async function listIssueCategories(opts = {}) {
  const force = Boolean(opts.force)
  if (!force && cachedCategories) return cachedCategories
  if (!force && inflight) return inflight

  inflight = (async () => {
    const data = await api('/api/issues')
    const list = Array.isArray(data?.categories)
      ? data.categories
          .filter((c) => c && c.active !== false)
          .map((c) => ({
            id: String(c.id),
            name: String(c.name || ''),
            active: c.active !== false,
            subs: (Array.isArray(c.subs) ? c.subs : [])
              .filter((s) => s && s.active !== false)
              .map((s) => ({
                id: String(s.id),
                name: String(s.name || ''),
                severity: s.severity,
                active: s.active !== false,
                usage90d: Number(s.usage90d) || 0,
              })),
          }))
      : []
    cachedCategories = list
    return list
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/**
 * Soft-deactivate a sub-category (`POST /api/issues/subcategories/:id/deactivate`).
 * Requires Issue master `d`.
 * @param {string} id
 */
export async function deactivateIssueSubcategory(id) {
  const row = await api(`/api/issues/subcategories/${encodeURIComponent(id)}/deactivate`, {
    method: 'POST',
    body: {},
  })
  clearIssueCache()
  return row
}

/**
 * Create a category (`POST /api/issues/categories`). Issue master `c`.
 * @param {{ name: string }} body
 */
export async function createIssueCategory(body) {
  const row = await api('/api/issues/categories', { method: 'POST', body })
  clearIssueCache()
  return row
}

/**
 * Create a sub-category (`POST /api/issues/subcategories`). Issue master `c`.
 * @param {{ categoryId: string, name: string, severity: 'Critical'|'Major'|'Minor' }} body
 */
export async function createIssueSubcategory(body) {
  const row = await api('/api/issues/subcategories', { method: 'POST', body })
  clearIssueCache()
  return row
}

/**
 * Hard-delete an unused category (`DELETE /api/issues/categories/:id`).
 * 409 IN_USE when referenced on tickets/events — caller should deactivate instead.
 * Requires Issue master `d`.
 * @param {string} id
 */
export async function deleteIssueCategory(id) {
  const row = await api(`/api/issues/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  clearIssueCache()
  return row
}

/**
 * Hard-delete an unused sub-category (`DELETE /api/issues/subcategories/:id`).
 * 409 IN_USE when referenced on tickets — caller should deactivate instead.
 * Requires Issue master `d`.
 * @param {string} id
 */
export async function deleteIssueSubcategory(id) {
  const row = await api(`/api/issues/subcategories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  clearIssueCache()
  return row
}

/**
 * Update a category (`PATCH /api/issues/categories/:id`). Issue master `e`.
 * @param {string} id
 * @param {{ name?: string, active?: boolean }} body
 */
export async function updateIssueCategory(id, body) {
  const row = await api(`/api/issues/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
  clearIssueCache()
  return row
}

/**
 * Update a sub-category (`PATCH /api/issues/subcategories/:id`).
 * Issue master `e`, or Technician / Engineer (backend).
 * @param {string} id
 * @param {{ name?: string, severity?: 'Critical'|'Major'|'Minor', active?: boolean }} body
 */
export async function updateIssueSubcategory(id, body) {
  const row = await api(`/api/issues/subcategories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
  clearIssueCache()
  return row
}
