import { api, clearToken, setToken } from './api'

export async function login(identifier, password) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { identifier, password },
  })
  if (data?.token) setToken(data.token)
  return data
}

export async function me() {
  return api('/api/auth/me')
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' })
  } catch {
    /* still clear local session if the token is already invalid */
  } finally {
    clearToken()
  }
}
