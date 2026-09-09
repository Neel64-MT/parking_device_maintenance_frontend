import { api, apiEnvelope, ApiRequestError } from './api'
import { clampPageSize, DEFAULT_PAGE_SIZE } from '../constants/pagination'
import {
  SCAN_DEVICE_FREE,
  SCAN_DEVICE_OPEN,
  SCAN_FREE_CODES,
} from '../data/scanDevice'

/**
 * Normalize QR / typed input to an uppercase lookup token.
 * Accepts plain IDs, QR-*, slots, or URL paths like .../device/PD-0428.
 * @param {string} raw
 */
export function normalizeScanCode(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed)
      const parts = url.pathname.split('/').filter(Boolean)
      const deviceIdx = parts.findIndex((p) => p.toLowerCase() === 'device')
      if (deviceIdx >= 0 && parts[deviceIdx + 1]) {
        return parts[deviceIdx + 1].toUpperCase()
      }
      if (parts.length) return parts[parts.length - 1].toUpperCase()
    }
  } catch {
    /* fall through */
  }

  const pathMatch = trimmed.match(/device[/\\]([A-Za-z0-9_-]+)/i)
  if (pathMatch) return pathMatch[1].toUpperCase()

  return trimmed.toUpperCase()
}

/**
 * Resolve a scanned / typed code to device payload.
 * Mock until QR format is finalized — later: GET /api/devices/scan?q=
 *
 * Any successful decode returns a device. Codes with FREE / PD-0501 → no open ticket;
 * everything else → PD-0428 with open TK-1042 (so Site attendant can exercise both paths).
 *
 * @param {string} raw
 * @returns {Promise<import('../data/scanDevice').ScanDevice | null>}
 */
export async function resolveScan(raw) {
  const code = normalizeScanCode(raw)
  if (!code) return null

  const free =
    SCAN_FREE_CODES.includes(code) ||
    code.includes('FREE') ||
    code === 'PD-0501' ||
    code === 'QR-PD0501'

  return free ? { ...SCAN_DEVICE_FREE } : { ...SCAN_DEVICE_OPEN }
}

export function canScanWithCamera(user) {
  return user?.role === 'Site attendant' || user?.role === 'Technician'
}

/**
 * List devices. Backend applies road scope + ticket visibility on open-ticket overlays.
 * Returns { rows, tiles, pagination } from the envelope (tiles beside `data`).
 */
export async function listDevices({
  q = '',
  road = '',
  status = '',
  repeats = '',
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
} = {}) {
  const safeLimit = clampPageSize(limit)
  const safePage = Math.max(1, Number(page) || 1)
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (road) params.set('road', road)
  if (status) params.set('status', status)
  if (repeats) params.set('repeats', repeats)
  params.set('page', String(safePage))
  params.set('limit', String(safeLimit))
  const envelope = await apiEnvelope(`/api/devices?${params}`)
  return {
    rows: envelope.data || [],
    tiles: envelope.tiles || [],
    pagination: envelope.pagination || {
      page: safePage,
      limit: safeLimit,
      total: 0,
      totalPages: 1,
    },
  }
}

/** Device history detail (GET /api/devices/:id). */
export async function getDevice(deviceId) {
  return api(`/api/devices/${encodeURIComponent(deviceId)}`)
}

/**
 * Start async Device Sync (POST /api/device-sync).
 * Returns { run, message } — run has id/status; work continues on the backend.
 */
export async function startDeviceSync() {
  const envelope = await apiEnvelope('/api/device-sync', { method: 'POST', body: {} })
  return {
    run: envelope.data,
    message: envelope.message || 'Device sync started successfully.',
  }
}

/** Poll a sync run by id (GET /api/device-sync/:id). */
export async function getDeviceSync(id) {
  return api(`/api/device-sync/${encodeURIComponent(id)}`)
}

/**
 * Latest sync run (GET /api/device-sync/latest).
 * Returns null when no runs exist (404).
 */
export async function getLatestDeviceSync() {
  try {
    return await api('/api/device-sync/latest')
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) return null
    throw err
  }
}
