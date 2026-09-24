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
 * List tickets. Backend applies role visibility.
 * Returns { rows, tiles, tabCounts, pagination } from the envelope
 * (tiles / tabCounts sit beside `data`, not inside it).
 */
export async function listTickets({
  tab,
  q = '',
  road = '',
  status = '',
  category = '',
  assignee = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
} = {}) {
  const safeLimit = clampPageSize(limit)
  const safePage = Math.max(1, Number(page) || 1)
  const params = new URLSearchParams()
  if (tab) params.set('tab', tab)
  if (q.trim()) params.set('q', q.trim())
  if (road) params.set('road', road)
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (assignee) params.set('assignee', assignee)
  params.set('page', String(safePage))
  params.set('limit', String(safeLimit))
  const envelope = await apiEnvelope(`/api/tickets?${params}`)
  return {
    rows: (envelope.data || []).map(mapTicketRow),
    tiles: envelope.tiles || [],
    tabCounts: envelope.tabCounts || { new: 0, asg: 0, cls: 0 },
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
 * }} body
 * @returns {Promise<{ id: string, uuid: string, eventId: string, status: string }>}
 */
export async function createTicket(body) {
  const payload = {
    deviceId: body.deviceId,
    description: body.description || undefined,
    photos: body.photos || [],
  }
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
 * Optional `issues[]` replaces found-role issues (send full list when editing).
 * @param {string} ticketId
 * @param {{
 *   updateType: string,
 *   workDone?: string,
 *   cost?: number,
 *   parts?: string[],
 *   photos?: string[],
 *   issues?: { categoryId: string, subCategoryId: string }[],
 *   categoryId?: string,
 *   subCategoryId?: string,
 * }} body
 * @returns {Promise<{ id: string, eventId: string, status: string, resolvedReady?: boolean }>}
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
 * Assign / reassign a ticket (POST /api/tickets/:id/assign).
 * Requires All tickets `a` + Admin / PM / Control room (backend enforces).
 * @param {string} ticketId
 * @param {{ assigneeId: string, reason?: string, isFirstAssign?: boolean }} body
 * @returns {Promise<{
 *   id: string,
 *   assigneeId: string,
 *   assigneeName: string,
 *   assignmentTrail: { when: string, title: string, body?: string }[],
 * }>}
 */
export async function assignTicket(ticketId, { assigneeId, reason, isFirstAssign = false } = {}) {
  const payload = { assigneeId }
  const note = typeof reason === 'string' ? reason.trim() : ''
  // Backend defaults empty reason; send Assigned vs Reassigned for clear trail copy.
  payload.reason = note || (isFirstAssign ? 'Assigned' : 'Reassigned')
  return api(`/api/tickets/${encodeURIComponent(ticketId)}/assign`, {
    method: 'POST',
    body: payload,
  })
}
