/**
 * Canonical device payload returned after a QR scan (mock until QR format is live).
 * open ticket = status ≠ Closed (at most one per device).
 */

/** @typedef {object} ScanDevice
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {string} locationSite
 * @property {string} slot
 * @property {string} currentStatus
 * @property {string} statusDate
 * @property {number} ticketsLast6Months
 * @property {string|null} openTicketId
 * @property {string|null} openTicketAge
 * @property {string|null} openTicketIssue
 * @property {string} latitude
 * @property {string} longitude
 */

/** Device with an open ticket (default scan hit). */
export const SCAN_DEVICE_OPEN = {
  deviceId: 'PD-0428',
  deviceName: 'Parking device PD-0428',
  locationSite: 'Science City',
  slot: 'S2-114',
  currentStatus: 'Under repair',
  statusDate: '02 Apr 2026',
  ticketsLast6Months: 6,
  openTicketId: 'TK-1042',
  openTicketAge: '8 days',
  openTicketIssue: 'Motor failure',
  latitude: '23.0702',
  longitude: '72.5175',
}

/** Device with no open ticket (codes containing FREE / PD-0501 / S3-201). */
export const SCAN_DEVICE_FREE = {
  deviceId: 'PD-0501',
  deviceName: 'Parking device PD-0501',
  locationSite: 'Science City',
  slot: 'S3-201',
  currentStatus: 'Working',
  statusDate: '18 May 2026',
  ticketsLast6Months: 1,
  openTicketId: null,
  openTicketAge: null,
  openTicketIssue: null,
  latitude: '23.0711',
  longitude: '72.5188',
}

/** Codes that force the free-device mock (no open ticket). */
export const SCAN_FREE_CODES = ['FREE', 'PD-0501', 'QR-PD0501', 'S3-201']

/**
 * Build DeviceCard-friendly facts from a scan payload.
 * @param {ScanDevice} scan
 */
export function scanDeviceFacts(scan) {
  const facts = [
    { label: 'Device name', value: scan.deviceName },
    { label: 'Status', value: scan.currentStatus },
    { label: 'Status date', value: scan.statusDate },
    { label: 'Tickets in 6 months', value: String(scan.ticketsLast6Months) },
    { label: 'Road / slot', value: `${scan.locationSite} · ${scan.slot}` },
    { label: 'Latitude', value: scan.latitude },
    { label: 'Longitude', value: scan.longitude },
  ]
  if (scan.openTicketId) {
    facts.splice(3, 0, {
      label: 'Open ticket',
      value: `${scan.openTicketId} — ${scan.openTicketIssue || 'Open'} (${scan.openTicketAge || '—'})`,
    })
  } else {
    facts.splice(3, 0, { label: 'Open ticket', value: 'None' })
  }
  return facts
}

/**
 * @param {ScanDevice} scan
 * @returns {'ok'|'warn'|'bad'|'grey'}
 */
export function scanStatusTone(scan) {
  if (!scan.openTicketId && scan.currentStatus === 'Working') return 'ok'
  if (scan.currentStatus === 'Under repair' || scan.currentStatus === 'Waiting for spare') return 'warn'
  if (scan.openTicketId) return 'warn'
  return 'grey'
}
