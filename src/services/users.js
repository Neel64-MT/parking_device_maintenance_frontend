import { api } from './api'

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

export async function listRoles() {
  return api('/api/roles')
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

/** Dashboard is the home screen only for Admin and Project manager. */
export function isDashboardRole(user) {
  return user?.role === 'Admin' || user?.role === 'Project manager'
}

/**
 * Field roles that update tickets via QR / Update Ticket flow (not Detail Add Update).
 * "Engineer" matches role names containing Engineer (e.g. Dy. Engineer) and AMC officer.
 */
export function isFieldTicketUpdater(user) {
  const role = user?.role || ''
  if (role === 'Technician') return true
  if (role === 'AMC officer') return true
  return /engineer/i.test(role)
}

/** Ops roles that use Detail Add Update (not the field Update Ticket QR entry). */
export function isOpsTicketUpdater(user) {
  const role = user?.role || ''
  return role === 'Admin' || role === 'Project manager' || role === 'Control room'
}

/** Post-login / index landing path by role. */
export function homePathForUser(user) {
  return isDashboardRole(user) ? '/dashboard' : '/tickets'
}
