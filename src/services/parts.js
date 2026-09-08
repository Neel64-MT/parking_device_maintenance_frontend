import { api } from './api'

/** @typedef {{ id: string, name: string, amount: number, active?: boolean }} PartMasterItem */

/** @type {PartMasterItem[] | null} */
let cachedParts = null
/** @type {Promise<PartMasterItem[]> | null} */
let inflight = null

/**
 * Active parts from Parts (`GET /api/parts`).
 * Session-cached; pass `{ force: true }` to refetch.
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<PartMasterItem[]>}
 */
export async function listParts(opts = {}) {
  const force = Boolean(opts.force)
  if (!force && cachedParts) return cachedParts
  if (!force && inflight) return inflight

  inflight = (async () => {
    const data = await api('/api/parts')
    const list = Array.isArray(data)
      ? data.map((row) => ({
          id: String(row.id),
          name: String(row.name || ''),
          amount: Number(row.amount) || 0,
          active: row.active !== false,
        }))
      : []
    cachedParts = list
    return list
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/** Clear session cache (after Parts CRUD). */
export function clearPartsCache() {
  cachedParts = null
  inflight = null
}

/**
 * Create a part (`POST /api/parts`). Issue create, or Technician role.
 * @param {{ name: string, amount: number }} body
 */
export async function createPart(body) {
  const row = await api('/api/parts', { method: 'POST', body })
  clearPartsCache()
  return row
}

/**
 * Update a part (`PATCH /api/parts/:id`). Issue edit, or Technician role.
 * @param {string} id
 * @param {{ name?: string, amount?: number, active?: boolean }} body
 */
export async function updatePart(id, body) {
  const row = await api(`/api/parts/${encodeURIComponent(id)}`, { method: 'PATCH', body })
  clearPartsCache()
  return row
}

/**
 * Display-only sum of master amounts for selected ids (not authoritative visit cost).
 * @param {PartMasterItem[]} items
 * @param {string[]} selectedIds
 */
export function sumSelectedPartsAmount(items, selectedIds) {
  const set = new Set(selectedIds || [])
  let total = 0
  for (const item of items || []) {
    if (set.has(item.id)) total += Number(item.amount) || 0
  }
  return total
}
