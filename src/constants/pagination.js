/** Shared table page-size options (server-side pagination). */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 25

export function clampPageSize(limit) {
  const n = Number(limit)
  return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE
}
