import { useCallback, useMemo, useState } from 'react'

/**
 * Client-side table search — React equivalent of bindTableSearch.
 * Returns query state and a filter helper for row text.
 *
 * @param {string} [initial='']
 */
export function useTableSearch(initial = '') {
  const [query, setQuery] = useState(initial)

  const normalized = useMemo(() => query.trim().toLowerCase(), [query])

  const matches = useCallback(
    (text) => {
      if (!normalized) return true
      return String(text ?? '')
        .toLowerCase()
        .includes(normalized)
    },
    [normalized],
  )

  const filterRows = useCallback(
    (rows, getText) => {
      if (!normalized) return rows
      return rows.filter((row) =>
        matches(typeof getText === 'function' ? getText(row) : row),
      )
    },
    [normalized, matches],
  )

  return { query, setQuery, normalized, matches, filterRows }
}
