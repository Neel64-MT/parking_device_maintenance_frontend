/**
 * Canonical device payload returned after a QR scan (GET /api/devices/scan).
 * open ticket = status ≠ Closed (at most one per device / Slot Id).
 */

/** @typedef {object} ScanDevice
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {string} locationSite
 * @property {string} slot
 * @property {number|null} [slotId]
 * @property {string|null} [slotLabel]
 * @property {string|null} [slotIdentifier]
 * @property {string|null} [qrNumber]
 * @property {string|null} [qr]
 * @property {string|null} [parkingLocation]
 * @property {string} currentStatus
 * @property {string} statusDate
 * @property {number} ticketsLast6Months
 * @property {string|null} openTicketId
 * @property {string|null} openTicketAge
 * @property {string|null} openTicketIssue
 * @property {string|null} [latitude]
 * @property {string|null} [longitude]
 */

/** Sample open-ticket payload (UiKit / docs only — live path uses resolveScan). */
export const SCAN_DEVICE_OPEN = {
  deviceId: 'PD-0428',
  deviceName: 'Parking device PD-0428',
  locationSite: 'Science City',
  slot: 'S2-114',
  slotId: 6582,
  slotLabel: 'S2-114',
  slotIdentifier: null,
  qrNumber: 'AMCC2346',
  qr: 'AMCC2346',
  parkingLocation: 'Science City',
  currentStatus: 'Under repair',
  statusDate: '02 Apr 2026',
  ticketsLast6Months: 6,
  openTicketId: 'TK-1042',
  openTicketAge: '8 days',
  openTicketIssue: 'Motor failure',
  latitude: '23.0702',
  longitude: '72.5175',
}

/** Sample free-device payload (UiKit / docs only). */
export const SCAN_DEVICE_FREE = {
  deviceId: 'PD-0501',
  deviceName: 'Parking device PD-0501',
  locationSite: 'Science City',
  slot: 'S3-201',
  slotId: null,
  slotLabel: 'S3-201',
  slotIdentifier: null,
  qrNumber: 'QR-PD0501',
  qr: 'QR-PD0501',
  parkingLocation: 'Science City',
  currentStatus: 'Working',
  statusDate: '18 May 2026',
  ticketsLast6Months: 1,
  openTicketId: null,
  openTicketAge: null,
  openTicketIssue: null,
  latitude: '23.0711',
  longitude: '72.5188',
}

function displayOrDash(value) {
  if (value == null || value === '') return '—'
  return String(value)
}

/**
 * Build DeviceCard-friendly facts from a scan payload.
 * @param {ScanDevice} scan
 */
export function scanDeviceFacts(scan) {
  const qr = scan.qrNumber || scan.qr
  const parking = scan.parkingLocation || scan.locationSite
  const slotLabel = scan.slotLabel || scan.slot

  const facts = [
    { label: 'QR Number', value: displayOrDash(qr) },
    { label: 'Slot Id', value: displayOrDash(scan.slotId != null ? scan.slotId : scan.deviceId) },
    { label: 'Slot Label', value: displayOrDash(slotLabel) },
    { label: 'Slot Identifier', value: displayOrDash(scan.slotIdentifier) },
    { label: 'Parking Location', value: displayOrDash(parking) },
    { label: 'Status', value: displayOrDash(scan.currentStatus) },
  ]

  if (scan.openTicketId) {
    facts.push({
      label: 'Open ticket',
      value: `${scan.openTicketId} — ${scan.openTicketIssue || 'Open'} (${scan.openTicketAge || '—'})`,
    })
  } else {
    facts.push({ label: 'Open ticket', value: 'None' })
  }

  if (scan.latitude != null && scan.latitude !== '') {
    facts.push({ label: 'Latitude', value: String(scan.latitude) })
  }
  if (scan.longitude != null && scan.longitude !== '') {
    facts.push({ label: 'Longitude', value: String(scan.longitude) })
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
