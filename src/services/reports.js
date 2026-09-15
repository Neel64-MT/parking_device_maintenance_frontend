import { api, ApiRequestError, getToken } from './api'

/**
 * @typedef {'day' | 'week' | 'month' | 'range'} WorkReportView
 *
 * @typedef {object} WorkReportPerson
 * @property {string} name
 * @property {string} role
 * @property {string} roads
 * @property {number} days
 * @property {number} visits
 * @property {number} worked
 * @property {number} closed
 * @property {number} open
 * @property {string} [cost]
 * @property {number} load
 * @property {string[][]} tickets
 *
 * @typedef {object} WorkReportData
 * @property {WorkReportView | string} view
 * @property {string} sub
 * @property {string} daysLabel
 * @property {number} daysInPeriod
 * @property {string} note
 * @property {WorkReportPerson[]} people
 *
 * @typedef {object} WorkReportFilters
 * @property {WorkReportView} [view]
 * @property {string} [from]
 * @property {string} [to]
 * @property {string} [person]
 * @property {string} [road]
 */

/**
 * Build query string for work report / export.
 * Omits Everyone / All roads; sends from/to only when view is range.
 * @param {WorkReportFilters} filters
 */
export function buildWorkReportQuery({
  view = 'day',
  from = '',
  to = '',
  person = '',
  road = '',
} = {}) {
  const params = new URLSearchParams()
  params.set('view', view || 'day')
  if (view === 'range') {
    if (from) params.set('from', from)
    if (to) params.set('to', to)
  }
  if (person && person !== 'Everyone') params.set('person', person)
  if (road && road !== 'All roads') params.set('road', road)
  return params.toString()
}

/**
 * Field-staff work report (`GET /api/reports/work`).
 * @param {WorkReportFilters} filters
 * @returns {Promise<WorkReportData>}
 */
export async function getWorkReport(filters = {}) {
  const qs = buildWorkReportQuery(filters)
  const data = await api(`/api/reports/work?${qs}`)
  return {
    view: data?.view || filters.view || 'day',
    sub: String(data?.sub || ''),
    daysLabel: String(data?.daysLabel || 'Days worked'),
    daysInPeriod: Number(data?.daysInPeriod) || 1,
    note: String(data?.note || ''),
    people: Array.isArray(data?.people) ? data.people : [],
  }
}

/**
 * Download CSV export (`GET /api/reports/work/export`).
 * Uses raw fetch — response is CSV, not JSON.
 * @param {WorkReportFilters} filters
 */
export async function exportWorkReport(filters = {}) {
  const qs = buildWorkReportQuery(filters)
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api/reports/work/export?${qs}`, { headers })
  if (!res.ok) {
    let message = `Export failed (${res.status})`
    let code = null
    let details = null
    try {
      const payload = await res.json()
      if (payload?.error) message = String(payload.error)
      code = payload?.code || null
      details = payload?.details || null
    } catch {
      /* non-JSON error body */
    }
    throw new ApiRequestError(message, { status: res.status, code, details })
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'work-report.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
