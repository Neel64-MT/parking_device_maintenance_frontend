import { api, apiEnvelope } from './api'

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
  limit = 50,
} = {}) {
  const params = new URLSearchParams()
  if (tab) params.set('tab', tab)
  if (q.trim()) params.set('q', q.trim())
  if (road) params.set('road', road)
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (assignee) params.set('assignee', assignee)
  params.set('page', String(page))
  params.set('limit', String(limit))
  const envelope = await apiEnvelope(`/api/tickets?${params}`)
  return {
    rows: (envelope.data || []).map(mapTicketRow),
    tiles: envelope.tiles || [],
    tabCounts: envelope.tabCounts || { new: 0, asg: 0, cls: 0 },
    pagination: envelope.pagination || { page: 1, limit, total: 0, totalPages: 1 },
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
