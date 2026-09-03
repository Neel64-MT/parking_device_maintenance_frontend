/**
 * Static content for TicketDetail (TK-1042) from ticket-detail.html.
 */

export const ticketHeader = {
  id: 'TK-1042',
  deviceId: 'PD-0428',
  road: 'Science City',
  slot: 'S2-114',
  status: 'Under repair',
  statusTone: 'warn',
  facts: [
    { label: 'Raised on', value: '24 Aug 2026, 09:15' },
    { label: 'Raised by', value: 'Nilesh Chauhan', extra: '(site attendant)' },
    { label: 'Assigned to', value: 'Ramesh Vaghela' },
    { label: 'Days open', value: '8 days', bad: true },
    { label: 'Site visits so far', value: '3' },
    { label: 'Updates logged', value: '5' },
    { label: 'Parts replaced', value: 'None yet' },
    { label: 'Cost so far', value: '₹ 0' },
  ],
}

export const workHistory = [
  {
    tone: 'warn',
    when: '30 Aug 2026, 11:20 · Ramesh Vaghela',
    title: 'Waiting for spare',
    status: 'Still open',
    statusClass: 'hold',
    body: 'Motor and gearbox assembly indented from the OEM on 27 Aug. Supplier confirmed dispatch for 02 Sep. Nothing to do at site until it arrives.',
    meta: [
      { kind: 'nextVisit', date: '03 Sep 2026' },
      { kind: 'text', text: 'No part replaced' },
      { kind: 'cost', amount: '₹ 0' },
    ],
  },
  {
    tone: 'warn',
    when: '26 Aug 2026, 15:45 · Ramesh Vaghela',
    title: 'Site visit — not resolved',
    status: 'Still open',
    statusClass: 'hold',
    body: 'Opened the housing and confirmed the gearbox is seized. Cannot be repaired on site. Flap left in the down position and the slot barricaded so vehicles do not park on it.',
    meta: [
      { kind: 'text', text: 'Mechanical › Motor failure' },
      { kind: 'text', text: 'No part replaced' },
      { kind: 'cost', amount: '₹ 0' },
    ],
  },
  {
    tone: 'bad',
    when: '25 Aug 2026, 10:30 · Ramesh Vaghela',
    title: 'Issue reclassified',
    status: 'Still open',
    statusClass: 'open',
    body: 'Checked the controller board first as reported. Board is healthy and giving the open command correctly. Motor is not responding to the command, so the fault is mechanical, not electrical. Category changed.',
    meta: [
      { kind: 'changedFrom', text: 'Electrical › Controller board failure' },
      { kind: 'changedTo', text: 'Mechanical › Motor failure' },
    ],
  },
  {
    tone: '',
    when: '24 Aug 2026, 12:00 · Control Room — Shift A',
    title: 'Assigned to technician',
    status: 'Still open',
    statusClass: 'open',
    body: 'Ticket assigned to Ramesh Vaghela, who covers Science City.',
    meta: null,
  },
  {
    tone: 'bad',
    when: '24 Aug 2026, 09:15 · Nilesh Chauhan',
    title: 'Ticket raised',
    status: 'Open',
    statusClass: 'open',
    body: 'Flap not opening after payment. Two vehicles waiting at the slot. Attendant guessed it was a board problem because the display was blank.',
    meta: [
      { kind: 'reportedAs', text: 'Electrical › Controller board failure' },
      { kind: 'text', text: 'Photo attached' },
    ],
  },
]

export const assignmentTrail = [
  {
    tone: 'warn',
    when: '27 Aug 2026, 09:10',
    title: 'Jignesh Solanki → Ramesh Vaghela',
    status: 'Holds it now',
    statusClass: 'hold',
    body: 'Board checked and found healthy. Fault is mechanical, handed back.',
  },
  {
    tone: '',
    when: '26 Aug 2026, 16:05',
    title: 'Ramesh Vaghela → Jignesh Solanki',
    status: null,
    body: 'Sent for an electrical opinion before ordering the motor.',
  },
  {
    tone: '',
    when: '24 Aug 2026, 12:00',
    title: 'Control Room — Shift A → Ramesh Vaghela',
    status: null,
    body: 'First assignment. Ramesh covers Science City.',
  },
  {
    tone: '',
    when: '24 Aug 2026, 09:15',
    title: 'Raised by Nilesh Chauhan',
    status: null,
    body: 'Left unassigned for the control room to route.',
  },
]

export const devicePreviousTickets = [
  { id: 'TK-0904', issue: 'Power supply / SMPS failure', days: 1 },
  { id: 'TK-0812', issue: 'Vehicle hit the flap', days: 4 },
  { id: 'TK-0688', issue: 'Sensor dirty or blocked', days: 0 },
  { id: 'TK-0603', issue: 'Limit switch faulty', days: 1 },
  { id: 'TK-0521', issue: 'Controller board failure', days: 3 },
]
