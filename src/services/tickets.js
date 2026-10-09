import { api, apiEnvelope } from './api'
import { clampPageSize, DEFAULT_PAGE_SIZE } from '../constants/pagination'

/** Ticket workflow statuses no longer include "New" — treat legacy as Open. */
export function normalizeTicketStatus(status) {
  return status === 'New' ? 'Open' : status
}

function mapTicketRow(row) {
  if (!row) return row
  return { ...row, status: normalizeTicketStatus(row.status) }
}

/**
 * List tickets. Anyone with All tickets `v` sees every ticket (no holder filter).
 * `tab` is `open` (raised, no update yet), `urp` (at least one update) or `cls`.
 * `age: 'over3'` limits Open / Under repair to tickets raised more than 3 days ago.
 * `device` (Slot View) limits the list to one slot; omit `tab` to include every status.
 * Returns { rows, tiles, tabCounts: { open, urp, cls }, over3Counts: { open, urp }, pagination }
 * from the envelope (tiles / counts sit beside `data`, not inside it).
 */
export async function listTickets({
  tab,
  q = '',
  road = '',
  status = '',
  category = '',
  age = '',
  device = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
} = {}) {
  const safeLimit = clampPageSize(limit)
  const safePage = Math.max(1, Number(page) || 1)
  const params = new URLSearchParams()
  if (tab) params.set('tab', tab)
  if (device) params.set('device', device)
  if (q.trim()) params.set('q', q.trim())
  if (road) params.set('road', road)
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (age) params.set('age', age)
  params.set('page', String(safePage))
  params.set('limit', String(safeLimit))
  const envelope = await apiEnvelope(`/api/tickets?${params}`)
  return {
    rows: (envelope.data || []).map(mapTicketRow),
    tiles: envelope.tiles || [],
    tabCounts: envelope.tabCounts || { open: 0, urp: 0, cls: 0 },
    over3Counts: envelope.over3Counts || { open: 0, urp: 0 },
    pagination: envelope.pagination || {
      page: safePage,
      limit: safeLimit,
      total: 0,
      totalPages: 1,
    },
  }
}

export async function getTicket(ticketId) {
  const data = await api(`/api/tickets/${encodeURIComponent(ticketId)}`)
  if (!data?.header) return data
  return {
    ...data,
    header: {
      ...data.header,
      status: normalizeTicketStatus(data.header.status),
    },
  }
}

/**
 * Raise a new ticket (POST /api/tickets). Prefer `issues[]`; legacy single pair still accepted by BE.
 * Prefer photos: [] here, then uploadImages, then attachTicketRaisePhotos — so the
 * ticket lands before slow uploads (same order as Add Update).
 * @param {{
 *   deviceId: string,
 *   issues?: { categoryId: string, subCategoryId: string }[],
 *   categoryId?: string,
 *   subCategoryId?: string,
 *   description?: string,
 *   photos?: string[],
 *   whatsappAt?: string,
 * }} body A new ticket is always Open; tickets are never assigned.
 * `whatsappAt` (ISO) = when it was posted in the WhatsApp group; omit when not from WhatsApp.
 * @returns {Promise<{ id: string, uuid: string, eventId: string, status: string }>}
 */
export async function createTicket(body) {
  const payload = {
    deviceId: body.deviceId,
    description: body.description || undefined,
    photos: body.photos || [],
  }
  if (body.whatsappAt) payload.whatsappAt = body.whatsappAt
  if (Array.isArray(body.issues) && body.issues.length) {
    payload.issues = body.issues.map((i) => ({
      categoryId: i.categoryId,
      subCategoryId: i.subCategoryId,
    }))
  } else if (body.categoryId && body.subCategoryId) {
    payload.categoryId = body.categoryId
    payload.subCategoryId = body.subCategoryId
  }
  return api('/api/tickets', {
    method: 'POST',
    body: payload,
  })
}

/**
 * Attach uploaded photo URLs to the raised event created by createTicket.
 * @param {string} ticketId
 * @param {string} eventId
 * @param {string[]} photos
 */
export async function attachTicketRaisePhotos(ticketId, eventId, photos) {
  return api(
    `/api/tickets/${encodeURIComponent(ticketId)}/raised/${encodeURIComponent(eventId)}/photos`,
    {
      method: 'PATCH',
      body: { photos },
    },
  )
}

/**
 * Add a site update / visit note. Body matches POST /api/tickets/:id/updates.
 * Prefer photos: [] here, then upload, then attachTicketUpdatePhotos — so uploads
 * only run after the update is accepted.
 * Anyone with Update ticket `e` may update any open ticket — tickets have no holder.
 * Optional `issues[]` replaces found-role issues (legacy; the Add Update form no longer sends it).
 * @param {string} ticketId
 * @param {{
 *   updateType: string,
 *   workDone?: string,
 *   cost?: number,
 *   parts?: string[],
 *   photos?: string[],
 *   issues?: { categoryId: string, subCategoryId: string }[],
 *   closeTicket?: boolean,
 *   resolveCategoryIds?: string[],
 *   resolveIssueIds?: string[],
 *   addIssues?: { categoryId: string, subCategoryId: string }[],
 *   whatsappAt?: string,
 * }} body
 * - `closeTicket: true` saves the update and closes the ticket in one transaction
 *   (needs Update ticket `x`); omitted keeps the ticket open. Closing also
 *   resolves every reported issue that is still Open.
 * - `resolveCategoryIds` resolves every Open sub issue of that main issue on this ticket;
 *   `resolveIssueIds` resolves single `issuesReported[].id` rows. Both may be sent together.
 *   Errors: 400 INVALID_ISSUES (not on this ticket) or 409 ISSUE_ALREADY_RESOLVED (nothing Open).
 * - `addIssues` appends new Open reported issues. Errors: 409 ISSUE_ALREADY_ON_TICKET, or
 *   409 OPEN_TICKET_EXISTS when the sub issue is open on another ticket of this device.
 * @returns {Promise<{
 *   id: string,
 *   eventId: string,
 *   status: string,
 *   resolvedReady?: boolean,
 *   closed?: boolean,
 *   addedIssues?: { id: string, categoryId: string, subCategoryId: string, category: string, sub: string, status: 'Open' }[],
 *   resolvedIssues?: { id: string, categoryId: string, subCategoryId: string, category: string, sub: string, status: 'Resolved' }[],
 *   openIssueCount?: number,
 * }>}
 */
export async function addTicketUpdate(ticketId, body) {
  return api(`/api/tickets/${encodeURIComponent(ticketId)}/updates`, {
    method: 'POST',
    body,
  })
}

/**
 * Attach uploaded photo URLs to an update event created by addTicketUpdate.
 * @param {string} ticketId
 * @param {string} eventId
 * @param {string[]} photos
 */
export async function attachTicketUpdatePhotos(ticketId, eventId, photos) {
  return api(
    `/api/tickets/${encodeURIComponent(ticketId)}/updates/${encodeURIComponent(eventId)}/photos`,
    {
      method: 'PATCH',
      body: { photos },
    },
  )
}

/**
 * Close a ticket (POST /api/tickets/:id/close).
 * Requires `Update ticket` `x` and road access for dashboard roles; tickets have no holder.
 * `deviceTested` must not be a "not tested" value or the backend returns 400 NOT_TESTED.
 * @param {string} ticketId
 * @param {{
 *   issues?: { categoryId: string, subCategoryId: string }[],
 *   workDone: string,
 *   parts?: string[],
 *   photos?: string[],
 *   cost?: number,
 *   deviceTested: string,
 *   whatsappAt?: string,
 * }} body
 * @returns {Promise<{
 *   id: string,
 *   status: string,
 *   cost: number,
 *   partsCost: number,
 *   labourCost: number,
 *   parts: { id: string, name: string, amount: number }[],
 *   issuesFound: { categoryId: string, subCategoryId: string, category: string, sub: string, severity: string }[],
 * }>}
 */
export async function closeTicket(ticketId, body) {
  return api(`/api/tickets/${encodeURIComponent(ticketId)}/close`, {
    method: 'POST',
    body,
  })
}
