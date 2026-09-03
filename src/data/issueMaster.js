/**
 * Issue master — single source of truth for the design preview.
 * Ported from original asset/app.js ISSUE_MASTER.
 * Replace with a server call when the backend is ready.
 *
 * severity: Critical = device unusable, Major = works partly,
 *           Minor = cosmetic or no effect on operation
 */

export const ISSUE_MASTER = [
  {
    name: 'Mechanical',
    active: true,
    subs: [
      { name: 'Flap plate bent', severity: 'Critical' },
      { name: 'Hinge or pivot worn', severity: 'Major' },
      { name: 'Motor failure', severity: 'Critical' },
      { name: 'Gearbox or worm failure', severity: 'Critical' },
      { name: 'Limit switch faulty', severity: 'Major' },
      { name: 'Spring or damper', severity: 'Minor' },
      { name: 'Jammed by debris', severity: 'Major' },
    ],
  },
  {
    name: 'Electrical',
    active: true,
    subs: [
      { name: 'Controller board failure', severity: 'Critical' },
      { name: 'Wiring or connector loose', severity: 'Major' },
      { name: 'Fuse blown', severity: 'Major' },
      { name: 'Short circuit due to water', severity: 'Critical' },
    ],
  },
  {
    name: 'Power',
    active: true,
    subs: [
      { name: 'Mains supply cut', severity: 'Critical' },
      { name: 'Power supply / SMPS failure', severity: 'Critical' },
      { name: 'Power cable damaged', severity: 'Critical' },
      { name: 'MCB tripped', severity: 'Major' },
    ],
  },
  {
    name: 'Communication',
    active: true,
    subs: [
      { name: 'Network cable disconnected', severity: 'Major' },
      { name: 'Communication module faulty', severity: 'Major' },
      { name: 'Server sync failure', severity: 'Major' },
      { name: 'Weak network at site', severity: 'Minor' },
    ],
  },
  {
    name: 'Sensor',
    active: true,
    subs: [
      { name: 'Sensor not detecting vehicle', severity: 'Critical' },
      { name: 'Sensor misalignment', severity: 'Major' },
      { name: 'Sensor dirty or blocked', severity: 'Minor' },
    ],
  },
  {
    name: 'QR / payment',
    active: true,
    subs: [
      { name: 'QR plate damaged', severity: 'Major' },
      { name: 'QR plate missing', severity: 'Critical' },
      { name: 'Bollard broken', severity: 'Major' },
      { name: 'Payment gateway issue', severity: 'Critical' },
    ],
  },
  {
    name: 'External damage',
    active: true,
    subs: [
      { name: 'Vehicle hit the flap', severity: 'Critical' },
      { name: 'Two-wheeler forced entry', severity: 'Major' },
      { name: 'Vandalism', severity: 'Critical' },
      { name: 'Theft of parts', severity: 'Critical' },
    ],
  },
  {
    name: 'Civil',
    active: true,
    subs: [
      { name: 'Foundation loose', severity: 'Major' },
      { name: 'Paver settlement', severity: 'Minor' },
      { name: 'Water ingress in pit', severity: 'Critical' },
      { name: 'Cable cut by other agency', severity: 'Critical' },
    ],
  },
  {
    name: 'Operational',
    active: true,
    subs: [
      { name: 'User misuse', severity: 'Minor' },
      { name: 'Wrong operation by attendant', severity: 'Minor' },
      { name: 'False complaint', severity: 'Minor' },
    ],
  },
]

export function issueCategory(name) {
  return ISSUE_MASTER.find((c) => c.name === name)
}

export function issueSubCount() {
  return ISSUE_MASTER.reduce((n, c) => n + c.subs.length, 0)
}

/** CSS pill class for a severity string */
export function severityPillClass(severity) {
  if (severity === 'Critical') return 'p-bad'
  if (severity === 'Major') return 'p-warn'
  return 'p-grey'
}

/** Dummy 90-day ticket counts — from original issue-master.html */
export const ISSUE_USAGE = {
  'Motor failure': 13,
  'Flap plate bent': 16,
  'Limit switch faulty': 4,
  'Jammed by debris': 3,
  'Hinge or pivot worn': 2,
  'Gearbox or worm failure': 2,
  'Spring or damper': 1,
  'Controller board failure': 9,
  'Wiring or connector loose': 3,
  'Fuse blown': 2,
  'Short circuit due to water': 1,
  'Mains supply cut': 4,
  'Power supply / SMPS failure': 11,
  'Power cable damaged': 2,
  'MCB tripped': 3,
  'Network cable disconnected': 7,
  'Communication module faulty': 2,
  'Server sync failure': 2,
  'Weak network at site': 1,
  'Sensor not detecting vehicle': 8,
  'Sensor misalignment': 4,
  'Sensor dirty or blocked': 5,
  'QR plate damaged': 6,
  'QR plate missing': 2,
  'Bollard broken': 1,
  'Payment gateway issue': 0,
  'Vehicle hit the flap': 16,
  'Two-wheeler forced entry': 5,
  Vandalism: 2,
  'Theft of parts': 1,
  'Foundation loose': 4,
  'Paver settlement': 1,
  'Water ingress in pit': 5,
  'Cable cut by other agency': 1,
  'User misuse': 3,
  'Wrong operation by attendant': 2,
  'False complaint': 4,
}
