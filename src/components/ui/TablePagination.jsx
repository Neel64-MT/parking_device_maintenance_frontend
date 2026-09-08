import { Button } from './Button'
import { PAGE_SIZE_OPTIONS } from '../../constants/pagination'

/**
 * Server-driven table pagination bar.
 * @param {{
 *   page: number,
 *   limit: number,
 *   total: number,
 *   totalPages: number,
 *   disabled?: boolean,
 *   onPageChange: (page: number) => void,
 *   onLimitChange: (limit: number) => void,
 * }} props
 */
export function TablePagination({
  page,
  limit,
  total,
  totalPages,
  disabled = false,
  onPageChange,
  onLimitChange,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages)
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1
  const to = total === 0 ? 0 : Math.min(safePage * limit, total)

  return (
    <div className="table-pagination" role="navigation" aria-label="Table pagination">
      <div className="table-pagination-left">
        <label className="table-pagination-limit">
          <span className="muted">Rows per page</span>
          <select
            value={limit}
            disabled={disabled}
            aria-label="Rows per page"
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="table-pagination-range muted">
          {total === 0 ? '0 of 0' : `${from}–${to} of ${total}`}
        </span>
      </div>

      <div className="table-pagination-nav">
        <Button
          type="button"
          size="sm"
          className="table-pagination-btn"
          disabled={disabled || safePage <= 1}
          aria-label="Previous page"
          title="Previous"
          onClick={() => onPageChange(safePage - 1)}
        >
          <span className="table-pagination-btn-label">Previous</span>
        </Button>
        <span className="table-pagination-page muted" aria-live="polite">
          Page {safePage} of {safeTotalPages}
        </span>
        <Button
          type="button"
          size="sm"
          className="table-pagination-btn"
          disabled={disabled || safePage >= safeTotalPages}
          aria-label="Next page"
          title="Next"
          onClick={() => onPageChange(safePage + 1)}
        >
          <span className="table-pagination-btn-label">Next</span>
        </Button>
      </div>
    </div>
  )
}
