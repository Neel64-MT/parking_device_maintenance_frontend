import { api, apiEnvelope } from './api'
import { clampPageSize, DEFAULT_PAGE_SIZE } from '../constants/pagination'

/**
 * Slot View list — only slots with at least one ticket, Slot Label ascending (server order).
 * Rows: { id, uuid, slotId, slotLabel, road, ticketCount }. `id` is the route key for
 * `/slot-view/:slotId` (Slot Id, or PD-xxxx when the slot has no Slot Id).
 */
export async function listSlots({ q = '', page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
  const safeLimit = clampPageSize(limit)
  const safePage = Math.max(1, Number(page) || 1)
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  params.set('page', String(safePage))
  params.set('limit', String(safeLimit))
  const envelope = await apiEnvelope(`/api/slot-view?${params}`)
  return {
    rows: envelope.data || [],
    pagination: envelope.pagination || {
      page: safePage,
      limit: safeLimit,
      total: 0,
      totalPages: 1,
    },
  }
}

/**
 * One slot: { slot, ticketCount, unresolvedIssues }. `unresolvedIssues` holds only Open
 * reported Sub Issues (one per Sub Issue) with the tickets that carry them.
 * Ticket rows come from `listTickets({ device })`.
 */
export function getSlot(slotId) {
  return api(`/api/slot-view/${encodeURIComponent(slotId)}`)
}
