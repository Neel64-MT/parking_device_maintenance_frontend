/**
 * Canonical device payload returned after a QR scan (GET /api/devices/scan).
 * open ticket = status ≠ Closed. A device may hold several open tickets, each for
 * different issues (Phase 50) — `openTickets` lists them all with their still-Open
 * reported issues; `openTicketId` / `openTicketIssue` / `openTicketAge` describe the
 * worst one (the one that drives `currentStatus`).
 * `assigneeId` is historical only (tickets are no longer assigned) and gates nothing.
 */

/** @typedef {object} ScanOpenIssue
 * @property {string} id
 * @property {string} categoryId
 * @property {string} subCategoryId
 * @property {string} category
 * @property {string} sub
 */

/** @typedef {object} ScanOpenTicket
 * @property {string} id
 * @property {string} status
 * @property {string|null} assigneeId
 * @property {string|null} age
 * @property {ScanOpenIssue[]} issues
 */

/** @typedef {object} ScanDevice
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {string} locationSite
 * @property {string} slot
 * @property {number|null} [slotId]
 * @property {string|null} [slotLabel]
 * @property {string|null} [slotIdentifier]
 * @property {string|null} [macId]
 * @property {string|null} [bleMac]
 * @property {string|null} [qrNumber]
 * @property {string|null} [qr]
 * @property {string|null} [parkingLocation]
 * @property {string} currentStatus
 * @property {string} statusDate
 * @property {number} ticketsLast6Months
 * @property {string|null} openTicketId
 * @property {string|null} openTicketAge
 * @property {string|null} openTicketIssue
 * @property {ScanOpenTicket[]} [openTickets]
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
  openTickets: [
    {
      id: 'TK-1042',
      status: 'Under repair',
      assigneeId: null,
      age: '8 days',
      issues: [
        { id: 'i-1', categoryId: 'c-1', subCategoryId: 's-1', category: 'Mechanical', sub: 'Motor failure' },
      ],
    },
  ],
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
  openTickets: [],
  latitude: '23.0711',
  longitude: '72.5188',
}

function displayOrDash(value) {
  if (value == null || value === '') return '—'
  return String(value)
}

/**
 * Open tickets on the scanned device, oldest first. Falls back to the single
 * `openTicketId` for payloads without `openTickets` (no issue list then).
 * @param {ScanDevice|null|undefined} scan
 * @returns {ScanOpenTicket[]}
 */
export function scanOpenTickets(scan) {
  if (!scan) return []
  if (Array.isArray(scan.openTickets)) return scan.openTickets
  if (!scan.openTicketId) return []
  return [
    {
      id: scan.openTicketId,
      status: 'Open',
      assigneeId: null,
      age: scan.openTicketAge || null,
      issues: [],
    },
  ]
}

/** "Motor failure, Display blank" — the still-Open issues of one open ticket. */
export function openTicketIssueLabel(ticket) {
  const names = (ticket?.issues || []).map((i) => i.sub).filter(Boolean)
  return names.length ? names.join(', ') : 'Open'
}

/**
 * Selected issue pairs that are already Open on one of the device's open tickets —
 * the same rule the API enforces with 409 OPEN_TICKET_EXISTS.
 * @param {ScanDevice|null|undefined} scan
 * @param {{ subCategoryId: string }[]} pairs
 * @returns {{ ticketId: string, issue: ScanOpenIssue }[]}
 */
export function findOpenIssueDuplicates(scan, pairs) {
  const wanted = new Set((pairs || []).map((p) => p.subCategoryId).filter(Boolean))
  const out = []
  for (const ticket of scanOpenTickets(scan)) {
    for (const issue of ticket.issues || []) {
      if (wanted.has(issue.subCategoryId)) out.push({ ticketId: ticket.id, issue })
    }
  }
  return out
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

  const open = scanOpenTickets(scan)
  if (Array.isArray(scan.openTickets) && open.length) {
    facts.push({
      label: open.length > 1 ? 'Open tickets' : 'Open ticket',
      value: open
        .map((t) => `${t.id} — ${openTicketIssueLabel(t)} (${t.age || '—'})`)
        .join('; '),
    })
  } else if (scan.openTicketId) {
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
  const hasOpen = scanOpenTickets(scan).length > 0
  if (!hasOpen && scan.currentStatus === 'Working') return 'ok'
  if (scan.currentStatus === 'Under repair' || scan.currentStatus === 'Waiting for spare') return 'warn'
  if (hasOpen) return 'warn'
  return 'grey'
}
