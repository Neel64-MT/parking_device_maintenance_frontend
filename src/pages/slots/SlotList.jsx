import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { ApiRequestError } from '../../services/api'
import { listSlots } from '../../services/slotView'
import { canPerm, homePathForUser } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { TablePagination } from '../../components/ui/TablePagination'

const COLS = 5

/** Slot View landing: slots with at least one ticket, Slot Label order from the server. */
export default function SlotList() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Slot View', 'v')

  const [query, setQuery] = useState('')
  const [appliedQ, setAppliedQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!canView) return undefined
    let cancelled = false

    async function run() {
      setLoadError('')
      setLoading(true)
      try {
        const result = await listSlots({ q: appliedQ, page, limit })
        if (cancelled) return
        setRows(result.rows)
        setPagination(result.pagination)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load slots.')
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [canView, appliedQ, page, limit])

  function applyFilters() {
    setPage(1)
    setAppliedQ(query.trim())
  }

  function resetFilters() {
    setQuery('')
    setPage(1)
    setAppliedQ('')
  }

  function handleLimitChange(nextLimit) {
    setLimit(nextLimit)
    setPage(1)
  }

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  const total = pagination.total || 0
  const crumb = loading ? null : `${total} ${total === 1 ? 'slot' : 'slots'} with tickets`

  return (
    <>
      <PageMeta pageId="slot-view" title="Slot View" crumb={crumb} />

      <main className="page">
        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters} disabled={loading}>
                Reset
              </Button>
              <Button variant="dark" onClick={applyFilters} disabled={loading}>
                Apply
              </Button>
            </>
          }
        >
          <Field label="Search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyFilters()
                }
              }}
              placeholder="Slot Id, slot label or road"
              aria-label="Search slots"
            />
          </Field>
        </FilterBar>

        <Panel
          title="Slots with tickets"
          subtitle="Only slots that have at least one ticket · sorted by Slot Label"
          flush
        >
          <div className="table-wrap">
            <table className="slot-table">
              <thead>
                <tr>
                  <th>Slot Id</th>
                  <th>Slot Label</th>
                  <th>Road</th>
                  <th className="num">Tickets</th>
                  <th className="act" />
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTable rows={6} cols={COLS} /> : null}
                {!loading && !rows.length ? (
                  <tr>
                    <td colSpan={COLS}>
                      {appliedQ ? (
                        <span className="muted">No slots match this search.</span>
                      ) : (
                        <EmptyState title="No tickets raised yet">
                          Slots appear here once a ticket is raised for them.
                        </EmptyState>
                      )}
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? rows.map((row) => {
                      const to = `/slot-view/${encodeURIComponent(row.id)}`
                      return (
                        <tr key={row.uuid}>
                          <td className="slot-cell">
                            <Link className="code" to={to}>
                              {row.id}
                            </Link>
                          </td>
                          <td className="slot-cell">
                            <Link className="code" to={to}>
                              {row.slotLabel || '—'}
                            </Link>
                          </td>
                          <td>{row.road}</td>
                          <td className="num">{row.ticketCount}</td>
                          <td className="act">
                            <div className="act-row">
                              <Link className="btn btn-sm" to={to}>
                                Open
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  : null}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={pagination.page || page}
            limit={limit}
            total={total}
            totalPages={pagination.totalPages || 1}
            disabled={loading}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        </Panel>
      </main>
    </>
  )
}
