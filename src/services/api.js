/**
 * Shared fetch helper for the backend API.
 * Expects { success, data, message } / { success: false, error, code }.
 */

const TOKEN_KEY = 'pdm_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiRequestError extends Error {
  constructor(message, { status = 0, code = null, details = null } = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** Full success payload (data + sibling fields such as tiles / pagination). */
export async function apiEnvelope(path, options = {}) {
  const { method = 'GET', body, auth = true, headers: extraHeaders } = options
  const headers = { ...(extraHeaders || {}) }

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(path.startsWith('/') ? path : `/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  let payload = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiRequestError('Unexpected server response', { status: res.status })
    }
  }

  if (!res.ok || payload?.success === false) {
    throw new ApiRequestError(payload?.error || `Request failed (${res.status})`, {
      status: res.status,
      code: payload?.code || null,
      details: payload?.details || null,
    })
  }

  return payload
}

export async function api(path, options = {}) {
  const payload = await apiEnvelope(path, options)
  return payload?.data
}
