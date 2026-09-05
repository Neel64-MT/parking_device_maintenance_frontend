/**
 * Users & roles preview data — from original users.html
 */

export const USER_TILES = [
  { value: '18', label: 'Total users' },
  { value: '9', label: 'Technicians' },
  { value: '5', label: 'Site attendants' },
  { value: '3', label: 'Control room' },
  { value: '1', label: 'AMC officer' },
]

export const ROLE_HELP = [
  {
    role: 'Admin',
    can: 'Everything, including masters and user accounts',
    cannot: '—',
  },
  {
    role: 'Project manager',
    can: 'All screens, assign tickets, close tickets, edit masters',
    cannot: 'Add or remove users',
  },
  {
    role: 'Control room',
    can: 'Raise tickets, assign to technicians, view dashboard and all devices',
    cannot: 'Close tickets, edit masters',
  },
  {
    role: 'Technician',
    can: 'See only tickets assigned to them, update and close with cause and photo',
    cannot: 'Raise tickets for other roads, see cost reports',
  },
  {
    role: 'Site attendant',
    can: 'Scan QR and raise a ticket for devices on their own road',
    cannot: 'Assign or close tickets',
  },
  {
    role: 'AMC officer',
    can: 'View dashboard, devices and tickets',
    cannot: 'Any change at all — view only',
  },
]

export const USER_ROWS = [
  {
    name: 'Alkesh Patel',
    you: true,
    mobile: '98250 xxxxx',
    role: 'Project manager',
    roleNote: null,
    roads: 'All roads',
    openTickets: null,
    openBad: false,
    lastActive: 'Today, 10:42',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Ramesh Vaghela',
    you: false,
    mobile: '90999 41128',
    role: 'Technician',
    roleNote: null,
    roads: 'Science City',
    openTickets: 9,
    openBad: true,
    lastActive: 'Today, 09:58',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Jignesh Solanki',
    you: false,
    mobile: '94280 33471',
    role: 'Technician',
    roleNote: null,
    roads: 'CG Road, Sindhu Bhavan Road',
    openTickets: 4,
    openBad: false,
    lastActive: 'Today, 08:20',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Mahesh Thakor',
    you: false,
    mobile: '97129 55620',
    role: 'Technician',
    roleNote: null,
    roads: 'Makarba',
    openTickets: 3,
    openBad: false,
    lastActive: 'Yesterday, 19:05',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Nilesh Chauhan',
    you: false,
    mobile: '90163 74408',
    role: 'Site attendant',
    roleNote: null,
    roads: 'Science City',
    openTickets: null,
    openBad: false,
    lastActive: 'Today, 07:15',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Kiran Bhatt',
    you: false,
    mobile: '93777 20914',
    role: 'Site attendant',
    roleNote: null,
    roads: 'CG Road',
    openTickets: null,
    openBad: false,
    lastActive: 'Today, 07:02',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Control Room — Shift A',
    you: false,
    mobile: '79900 11002',
    role: 'Control room',
    roleNote: null,
    roads: 'All roads',
    openTickets: null,
    openBad: false,
    lastActive: 'Today, 10:30',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Dy. Engineer, AMC',
    you: false,
    mobile: '98790 60013',
    role: 'AMC officer',
    roleNote: 'View only',
    roads: 'All roads',
    openTickets: null,
    openBad: false,
    lastActive: '28 Aug 2026',
    status: 'Active',
    statusTone: 'ok',
  },
  {
    name: 'Sanjay Rathod',
    you: false,
    mobile: '96874 40225',
    role: 'Technician',
    roleNote: null,
    roads: 'Sobo – Marigold',
    openTickets: null,
    openBad: false,
    lastActive: '04 Aug 2026',
    status: 'Inactive',
    statusTone: 'grey',
  },
]

export const ROLE_ROWS = [
  {
    name: 'Admin',
    scope: 'All roads',
    users: 1,
    usersLink: false,
    purpose: 'Full control including users and masters',
  },
  {
    name: 'Project manager',
    scope: 'All roads',
    users: 1,
    usersLink: false,
    purpose: 'Runs the project, sees every report',
  },
  {
    name: 'Control room',
    scope: 'All roads',
    users: 3,
    usersLink: true,
    purpose: 'Raises and routes tickets, does not repair',
  },
  {
    name: 'Technician',
    scope: 'Assigned roads only',
    users: 9,
    usersLink: false,
    purpose: 'Attends and closes tickets in the field',
  },
  {
    name: 'Site attendant',
    scope: 'Assigned roads only',
    users: 5,
    usersLink: false,
    purpose: 'Reports problems, nothing more',
  },
  {
    name: 'AMC officer',
    scope: 'All roads',
    users: 1,
    usersLink: false,
    purpose: 'Watches progress, changes nothing',
  },
]

/** Screens grouped the way the menu is grouped */
export const PERM_SCREENS = [
  ['Dashboard', ['Dashboard']],
  ['Tickets', ['Raise ticket', 'Update ticket', 'All tickets', 'Work report']],
  ['Devices', ['Device list', 'Add device', 'Device history', 'Scan QR']],
  ['Masters', ['Issue master', 'Road master']],
  ['Users', ['Users', 'Roles & permissions']],
]

/** Permission flags: v c e a x d = view create edit assign close delete */
export const PERM_FLAGS = ['v', 'c', 'e', 'a', 'x', 'd']

/**
 * Role permission codes — ported exactly from users.html ROLES.
 * Each screen string is 6 chars; char at index i equals the flag letter when allowed.
 */
export const ROLES = {
  Admin: {
    note: 'Full control. At least one admin must always exist.',
    p: {
      Dashboard: 'v.....',
      'Raise ticket': 'vc....',
      'Update ticket': 'vce.x.',
      'All tickets': 'vceaxd',
      'Work report': 'v.....',
      'Device list': 'vce..d',
      'Add device': 'vc....',
      'Device history': 'v.....',
      'Scan QR': 'v.....',
      'Issue master': 'vce..d',
      'Road master': 'vce..d',
      Users: 'vce..d',
      'Roles & permissions': 'vce..d',
    },
  },
  'Project manager': {
    note: 'City-wide ops; can manage users and approve signups; cannot delete masters.',
    p: {
      Dashboard: 'v.....',
      'Raise ticket': 'vc....',
      'Update ticket': 'vce.x.',
      'All tickets': 'vcea.x',
      'Work report': 'v.....',
      'Device list': 'vce...',
      'Add device': 'vc....',
      'Device history': 'v.....',
      'Scan QR': 'v.....',
      'Issue master': 'vce...',
      'Road master': 'vce...',
      Users: 'vce...',
      'Roles & permissions': 'v.....',
    },
  },
  'Control room': {
    note: 'Raises and routes tickets across all roads, but never closes one — closing belongs to whoever attended it.',
    p: {
      Dashboard: 'v.....',
      'Raise ticket': 'vc....',
      'Update ticket': 'v.....',
      'All tickets': 'vc.a..',
      'Work report': 'v.....',
      'Device list': 'v.....',
      'Add device': '......',
      'Device history': 'v.....',
      'Scan QR': 'v.....',
      'Issue master': 'v.....',
      'Road master': 'v.....',
      Users: '......',
      'Roles & permissions': '......',
    },
  },
  Technician: {
    note: 'Sees only devices and tickets on the roads assigned to them, and only the tickets they currently hold.',
    p: {
      Dashboard: '......',
      'Raise ticket': 'vc....',
      'Update ticket': 'vce.x.',
      'All tickets': 'v..a..',
      'Work report': '......',
      'Device list': 'v.....',
      'Add device': '......',
      'Device history': 'v.....',
      'Scan QR': 'v.....',
      'Issue master': 'v.....',
      'Road master': '......',
      Users: '......',
      'Roles & permissions': '......',
    },
  },
  'Site attendant': {
    note: 'Can report a problem and nothing else. Cannot see cost, reports or other roads.',
    p: {
      Dashboard: '......',
      'Raise ticket': 'vc....',
      'Update ticket': '......',
      'All tickets': 'v.....',
      'Work report': '......',
      'Device list': 'v.....',
      'Add device': '......',
      'Device history': '......',
      'Scan QR': 'v.....',
      'Issue master': 'v.....',
      'Road master': '......',
      Users: '......',
      'Roles & permissions': '......',
    },
  },
  'AMC officer': {
    note: 'View only, everywhere. Nothing on this screen can be ticked for this role.',
    p: {
      Dashboard: 'v.....',
      'Raise ticket': '......',
      'Update ticket': '......',
      'All tickets': 'v.....',
      'Work report': 'v.....',
      'Device list': 'v.....',
      'Add device': '......',
      'Device history': 'v.....',
      'Scan QR': '......',
      'Issue master': 'v.....',
      'Road master': 'v.....',
      Users: '......',
      'Roles & permissions': '......',
    },
  },
}

/** Whether a permission flag is on for a screen code string */
export function permOn(code, flagIndex) {
  const flags = PERM_FLAGS
  const c = (code || '......').charAt(flagIndex)
  return c === flags[flagIndex]
}
