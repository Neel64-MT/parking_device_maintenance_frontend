/**
 * Shared navigation config — ported from original asset/nav.js.
 * Edit MENU here to change the sidebar everywhere at once.
 */

export const APP = {
  nameLines: ['Parking Device', 'Maintenance'],
  sub: 'AMC Flap Based Parking',
  user: { name: 'Alkesh P.', role: 'Project manager', initials: 'AP' },
  footerLines: ['EXILIO Technology', 'v0.1 · design preview'],
}

/** SVG path markup keys used by NavIcons */
/**
 * id      = pageId for active matching
 * match   = other pageIds that keep this item highlighted
 * path    = React Router path
 */
export const MENU = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
  },
  {
    label: 'Tickets',
    icon: 'ticket',
    children: [
      {
        id: 'ticket-list',
        label: 'All tickets',
        path: '/tickets',
        match: ['ticket-raise', 'ticket-update', 'ticket-close', 'ticket-detail'],
      },
      {
        id: 'ticket-report',
        label: 'Work report',
        path: '/tickets/report',
      },
    ],
  },
  {
    id: 'device-list',
    label: 'Devices',
    icon: 'device',
    path: '/devices',
    match: ['device-add', 'device-detail', 'scan-qr'],
  },
  {
    label: 'Masters',
    icon: 'master',
    children: [
      {
        id: 'issue-master',
        label: 'Issue master',
        path: '/masters/issues',
      },
      {
        id: 'road-list',
        label: 'Road master',
        path: '/masters/roads',
        match: ['road-add'],
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'user',
    path: '/users',
  },
]

export function isMenuItemOn(item, pageId) {
  if (item.id === pageId) return true
  return !!(item.match && item.match.includes(pageId))
}
