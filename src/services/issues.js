import { api } from './api'

/**
 * @typedef {{ id: string, name: string, severity?: string, active?: boolean }} IssueSub
 * @typedef {{ id: string, name: string, active?: boolean, subs: IssueSub[] }} IssueCategory
 */

/** @type {IssueCategory[] | null} */
let cachedCategories = null
/** @type {Promise<IssueCategory[]> | null} */
let inflight = null

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
