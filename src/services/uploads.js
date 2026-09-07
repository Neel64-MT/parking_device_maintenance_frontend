import { api, ApiRequestError } from './api'

const MAX_BYTES = 8 * 1024 * 1024

/**
 * Validate an image File before upload (mirrors backend image/* + 8 MB).
 * @param {File} file
 * @returns {string|null} error message or null if ok
 */
export function validateImageFile(file) {
  if (!file) return 'No file selected.'
  if (!String(file.type || '').startsWith('image/')) {
    return 'Only image files are allowed.'
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 8 MB or smaller.'
  }
  return null
}

/**
 * Upload one image via POST /api/uploads (field name `file`).
 * @param {File} file
 * @returns {Promise<{ id: string, url: string, originalName: string, size: number }>}
 */
export async function uploadImage(file) {
  const err = validateImageFile(file)
  if (err) throw new ApiRequestError(err, { status: 400, code: 'VALIDATION_ERROR' })

  const body = new FormData()
  body.append('file', file)

  const data = await api('/api/uploads', { method: 'POST', body })
  if (!data?.url) {
    throw new ApiRequestError('Upload did not return a URL.', { status: 500 })
  }
  return data
}

/**
 * Upload pending local Files (e.g. from PhotoPicker) at form submit time.
 * @param {File[]} files
 * @returns {Promise<Array<{ id: string, url: string, originalName: string, size: number }>>}
 */
export async function uploadImages(files) {
  const list = Array.from(files || []).filter(Boolean)
  const out = []
  for (const file of list) {
    out.push(await uploadImage(file))
  }
  return out
}

export const IMAGE_MAX_BYTES = MAX_BYTES
