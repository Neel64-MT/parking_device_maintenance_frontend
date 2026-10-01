import { api } from './api'

/**
 * Privilege order highest → lowest (mirrors backend Phase 36 `role-hierarchy.ts`).
 * Same rank may create/assign; lower index = higher privilege.
 * Names must match `roles.name` exactly.
 */
export const ROLE_HIERARCHY = [
  'Admin',
  'Project manager',
  'Control room',
  'Engineer',
  'Technician',
  'Electrician',
  'Site attendant',
  'AMC officer',
]

/** 0 = highest privilege. Returns -1 if name is not in the hierarchy. */
export function roleRank(roleName) {
  return ROLE_HIERARCHY.indexOf(roleName)
}

/**
 * Actor may assign target when target is same rank or below (higher index).
 * Unknown roles (custom names not in hierarchy) are not assignable.
 */
export function canAssignRole(actorRoleName, targetRoleName) {
  const actorRank = roleRank(actorRoleName || '')
  const targetRank = roleRank(targetRoleName || '')
  if (actorRank < 0 || targetRank < 0) return false
  return targetRank >= actorRank
}

/**
 * Actor may edit a role's permission matrix when target is same rank or below.
 * Custom (unknown) names: Admin only (mirrors backend assertCanManageRolePermissions).
 */
export function canManageRolePermissions(actorRoleName, targetRoleName) {
  const actorRank = roleRank(actorRoleName || '')
  const targetRank = roleRank(targetRoleName || '')
  if (actorRank < 0) return false
  if (targetRank < 0) return actorRank === 0
  return targetRank >= actorRank
}

/**
 * Filter `GET /api/roles` rows to those the actor may assign (same-or-below).
 * @param {string} actorRoleName
 * @param {{ id: string, name: string }[]} roles
 */
export function filterAssignableRoles(actorRoleName, roles) {
  if (!Array.isArray(roles)) return []
  return roles.filter((r) => canAssignRole(actorRoleName, r?.name))
}

export async function listUsers({ q = '', status = '' } = {}) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  if (status) params.set('status', status)
  const qs = params.toString()
  return api(`/api/users${qs ? `?${qs}` : ''}`)
}

export async function createUser(body) {
  return api('/api/users', { method: 'POST', body })
}

export async function updateUser(id, body) {
  return api(`/api/users/${id}`, { method: 'PATCH', body })
}

/**
 * Delete a user account (`DELETE /api/users/:id`). Requires Users `d`.
 * This is a hard delete: the account is removed, and its reporter / assignee / actor
 * references on past tickets, events, assignments and sync runs are cleared, so the
 * tickets survive without the person's name. Self-delete is rejected by the backend.
 * @param {string} id
 */
export async function deleteUser(id) {
  return api(`/api/users/${id}`, { method: 'DELETE' })
}

export async function listRoles() {
  return api('/api/roles')
}

/**
 * Create a role (`POST /api/roles`). Requires Roles & permissions `c`.
 * @param {{ name: string, scope?: 'all_roads'|'assigned_roads', copyFromRoleId?: string|null, note?: string }} body
 */
export async function createRole(body) {
  return api('/api/roles', { method: 'POST', body })
}

/**
 * Update a role's permission matrix (`PATCH /api/roles/:id/permissions`).
 * Requires Roles & permissions `e`. Admin is locked on the backend.
 * @param {string} roleId
 * @param {Record<string, string>} permissions screen → 6-char code
 */
export async function updateRolePermissions(roleId, permissions) {
  return api(`/api/roles/${roleId}/permissions`, {
    method: 'PATCH',
    body: { permissions },
  })
}

/**
 * Delete a role (`DELETE /api/roles/:id`). Requires Roles & permissions `d`.
 * A role that is still assigned to a Pending or Active account is rejected by the
 * backend with `409 ROLE_IN_USE`; the message reaches the caller through
 * `ApiRequestError`. Inactive accounts do not block the delete — they end up with no
 * role and must be given one before they can be activated again.
 * @param {string} roleId
 */
export async function deleteRole(roleId) {
  return api(`/api/roles/${roleId}`, { method: 'DELETE' })
}

/**
 * Reset a role to seeded defaults (`POST /api/roles/:id/permissions/reset`).
 * Requires Roles & permissions `e`. Not available for Admin or custom roles without defaults.
 * @param {string} roleId
 */
export async function resetRolePermissions(roleId) {
  return api(`/api/roles/${roleId}/permissions/reset`, { method: 'POST' })
}

/**
 * Assignable field staff for Work report person filter (`GET /api/lookups/technicians`).
 * Requires All tickets `v`. Value for the report API is `name` (exact full_name).
 * @returns {Promise<{ id: string, name: string, role: string, label: string }[]>}
 */
export async function listTechnicianLookups() {
  const data = await api('/api/lookups/technicians')
  if (!Array.isArray(data)) return []
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name || ''),
    role: String(row.role || ''),
    label: String(row.label || row.name || ''),
  }))
}

/** Check a permission code string for a flag letter (v/c/e/a/x/d). */
export function canPerm(user, screen, flag) {
  const code = user?.permissions?.[screen] || '......'
  const idx = 'vceaxd'.indexOf(flag)
  return idx >= 0 && code[idx] === flag
}

/**
 * Field staff who attend devices on site (mirrors backend `FIELD_ROLES`).
 * They may raise, hold, update and close tickets, and claim an unassigned
 * ticket by adding an update. Names must match `roles.name` exactly.
 */
export const FIELD_ROLES = ['Technician', 'Engineer', 'Electrician']

export function isFieldRole(user) {
  return FIELD_ROLES.includes(user?.role)
}

/**
 * Roles offered in the Assign / Reassign "Hand to" dropdown.
 *
 * `GET /api/lookups/technicians` also returns Control room and Project manager
 * because the Work report Person filter needs them. A ticket is only ever held
 * by field staff, so the assign dropdown narrows to the field roles.
 *
 * This is a presentation guard; the backend `assertEligibleAssignee` remains the
 * final source of truth and is intentionally left unchanged.
 */
export const ASSIGNABLE_ASSIGNEE_ROLES = FIELD_ROLES

/**
 * Narrow a technicians lookup list to the assignable roles for the Hand to select.
 *
 * The ticket's current assignee is always kept so a ticket already held by a
 * non-assignable user (Control room / Project manager) still renders its
 * selection and can still be reassigned away from them.
 *
 * @param {{ id: string, name: string, role: string, label: string }[]} options
 * @param {string|null|undefined} currentAssigneeId
 * @param {string} [currentAssigneeName] fallback label when the current assignee
 *   is not in the lookup list (e.g. inactive user)
 */
export function filterAssignableAssignees(options, currentAssigneeId, currentAssigneeName) {
  if (!Array.isArray(options)) return []
  const currentId = currentAssigneeId == null ? '' : String(currentAssigneeId)
  const keep = options.filter(
    (o) => ASSIGNABLE_ASSIGNEE_ROLES.includes(o?.role) || String(o?.id) === currentId,
  )
  if (!currentId || keep.some((o) => String(o.id) === currentId)) return keep
  const name = (currentAssigneeName || '').trim()
  return [...keep, { id: currentId, name, role: '', label: name || `Current assignee ${currentId}` }]
}

/**
 * Notification-eligible roles.
 *
 * - New-ticket ("ticket.raised") alerts stay limited to the oversight roles.
 * - Assignment alerts add the roles that can actually be made a ticket assignee
 *   (FIELD_ROLES), so an assignee is never un-alertable.
 *
 * Site attendant and AMC officer are excluded because they are never eligible
 * assignees. This is a presentation guard; the backend remains the source of truth.
 */
const NOTIFICATION_ROLES = ['Admin', 'Project manager', 'Control room', ...FIELD_ROLES]

export function canReceiveTicketNotifications(user) {
  return canPerm(user, 'All tickets', 'v') && NOTIFICATION_ROLES.includes(user?.role)
}

/** Dashboard is the home screen only for Admin and Project manager. */
export function isDashboardRole(user) {
  return user?.role === 'Admin' || user?.role === 'Project manager'
}

/**
 * Field roles that update tickets via QR / Update Ticket flow (not Detail Add Update).
 * FIELD_ROLES plus AMC officer; "Engineer" also matches role names containing Engineer (e.g. Dy. Engineer) and AMC officer.
 */
export function isFieldTicketUpdater(user) {
  const role = user?.role || ''
  if (isFieldRole(user)) return true
  if (role === 'AMC officer') return true
  return /engineer/i.test(role)
}

/** Ops roles that use Detail Add Update (not the field Update Ticket QR entry). */
export function isOpsTicketUpdater(user) {
  const role = user?.role || ''
  return role === 'Admin' || role === 'Project manager' || role === 'Control room'
}

/** Post-login / index landing path — Dashboard View permission only. */
export function homePathForUser(user) {
  return canPerm(user, 'Dashboard', 'v') ? '/dashboard' : '/tickets'
}
