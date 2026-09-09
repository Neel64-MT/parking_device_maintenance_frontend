import { api } from './api'

/**
 * Roads for filters/dropdowns (`GET /api/lookups/roads`).
 * Thin read of the `roads` table (same rows Device Sync upserts).
 * @returns {Promise<{ id: string, code: string, name: string, status: string }[]>}
 */
export async function listRoadLookups() {
  const data = await api('/api/lookups/roads')
  if (!Array.isArray(data)) return []
  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code || ''),
    name: String(row.name || ''),
    status: String(row.status || ''),
  }))
}
