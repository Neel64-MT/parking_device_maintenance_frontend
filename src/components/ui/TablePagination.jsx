import { Button } from './Button'
import { PAGE_SIZE_OPTIONS } from '../../constants/pagination'

/**
 * Server-driven table pagination — Card Minimal (right-aligned), one row.
 * Page X of Y + per-page left; Previous / Next right (including ≤560).
 * @param {{
 *   page: number,
 *   limit: number,
 *   total?: number,
 *   totalPages: number,
 *   disabled?: boolean,
 *   onPageChange: (page: number) => void,
 *   onLimitChange: (limit: number) => void,
 * }} props
 */
export function TablePagination({
  page,
  limit,
  totalPages,
  disabled = false,
  onPageChange,
  onLimitChange,
}) {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const safePage = Math.min(Math.max(1, page || 1), safeTotalPages)

  return (
    <div className="table-pagination" role="navigation" aria-label="Table pagination">
      <div className="table-pagination-meta">
        <span className="table-pagination-page" aria-live="polite">
          Page {safePage} of {safeTotalPages}
        </span>
        <select
          className="table-pagination-limit-select"
          value={limit}
          disabled={disabled}
          aria-label="Rows per page"
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
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
          <span className="table-pagination-btn-label table-pagination-btn-label-full">Previous</span>
          <span className="table-pagination-btn-label table-pagination-btn-label-short">Prev</span>
        </Button>
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
