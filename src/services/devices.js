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
