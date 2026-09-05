/**
 * Shared navigation config — ported from original asset/nav.js.
 * Edit MENU here to change the sidebar everywhere at once.
 *
 * `screen` = key in user.permissions (from /api/auth/me); used for view (`v`) gating.
 * Settings has no permission screen — always shown for authenticated users.
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
 * screen  = permissions map key (omit only if always visible)
 */
export const MENU = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    screen: 'Dashboard',
  },
  {
    label: 'Tickets',
    icon: 'ticket',
    children: [
      {
        id: 'ticket-list',
        label: 'All tickets',
        icon: 'ticket-list',
        path: '/tickets',
        match: ['ticket-raise', 'ticket-update', 'ticket-close', 'ticket-detail'],
        screen: 'All tickets',
      },
      {
        id: 'ticket-report',
        label: 'Work report',
        icon: 'report',
        path: '/tickets/report',
        screen: 'Work report',
      },
    ],
  },
  {
    id: 'device-list',
    label: 'Devices',
    icon: 'device',
    path: '/devices',
    match: ['device-add', 'device-detail', 'scan-qr'],
    screen: 'Device list',
  },
  {
    label: 'Masters',
    icon: 'master',
    children: [
      {
        id: 'issue-master',
        label: 'Issue master',
        icon: 'issue',
        path: '/masters/issues',
        screen: 'Issue master',
      },
      {
        id: 'road-list',
        label: 'Road master',
        icon: 'road',
        path: '/masters/roads',
        match: ['road-add'],
        screen: 'Road master',
      },
    ],
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'user',
    path: '/users',
    screen: 'Users',
  },
]

/** Bottom utility — not part of MENU */
export const SETTINGS = {
  id: 'settings',
  label: 'Settings',
  icon: 'settings',
  path: '/settings',
}

export function isMenuItemOn(item, pageId) {
  if (item.id === pageId) return true
  return !!(item.match && item.match.includes(pageId))
}

/**
 * Drop menu leaves (and empty parent groups) the user cannot view.
 * `canView(screen)` should return true when permission flag `v` is set.
 */
export function filterMenuByView(menu, canView) {
  return menu
    .map((item) => {
      if (item.children) {
        const children = item.children.filter((c) => !c.screen || canView(c.screen))
        if (!children.length) return null
        return { ...item, children }
      }
      if (item.screen && !canView(item.screen)) return null
      return item
    })
    .filter(Boolean)
}
