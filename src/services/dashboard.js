import { api } from './api'

/** Dashboard payload (fleet / downReasons / roadStatus / crumb). Backend scopes ticket metrics. */
export async function getDashboard({ road = '', from = '', to = '' } = {}) {
  const params = new URLSearchParams()
  if (road) params.set('road', road)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return api(`/api/dashboard${qs ? `?${qs}` : ''}`)
}
