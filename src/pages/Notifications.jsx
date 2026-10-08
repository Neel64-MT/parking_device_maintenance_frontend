import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useOutletContext } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { useAuth } from '../context/AuthContext'
import { toast } from '../context/ToastContext'
import { DEFAULT_PAGE_SIZE } from '../constants/pagination'
import { ApiRequestError } from '../services/api'
import { listNotifications } from '../services/notifications'
import { homePathForUser } from '../services/users'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Panel } from '../components/ui/Panel'
import { SkeletonText } from '../components/ui/Skeleton'
import { TablePagination } from '../components/ui/TablePagination'
import { Tabs } from '../components/ui/Tabs'
import { NotificationItem } from '../components/notifications/NotificationItem'

const SKELETON_ROWS = 5

/** In-app path the bell's "View all" came from; anything else falls back to the user's home. */
function backPath(from, fallback) {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return fallback
  if (from === '/notifications' || from.startsWith('/notifications?')) return fallback
  return from
}

/** Every notification of the signed-in user ("View all" from the navbar bell), newest first. */
export default function Notifications() {
  const { user } = useAuth()
  const location = useLocation()
  const { eligible, unreadCount, openNotification, markAllRead, pushBusy } = useOutletContext()
  const unread = Number(unreadCount) || 0

  const [tab, setTab] = useState('all')
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
  const queryKeyRef = useRef('')

  /* Refetches when the shared unread count moves (new push, read elsewhere); only a tab/page change shows the skeleton. */
  useEffect(() => {
    if (!eligible) return undefined
    let cancelled = false
    const queryKey = `${tab}|${page}|${limit}`
    const showSkeleton = queryKey !== queryKeyRef.current
    queryKeyRef.current = queryKey

    async function run() {
      setLoadError('')
      if (showSkeleton) setLoading(true)
      try {
        const result = await listNotifications({ page, limit, unreadOnly: tab === 'unread' })
        if (cancelled) return
        if (!result.items.length && page > 1) {
          setPage((current) => Math.max(1, current - 1))
          return
        }
        setRows(result.items)
        setPagination(result.pagination)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load notifications.')
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
  }, [eligible, tab, page, limit, unread])

  function handleTabChange(next) {
    setTab(next)
    setPage(1)
  }

  function handleLimitChange(nextLimit) {
    setLimit(nextLimit)
    setPage(1)
  }

  async function handleMarkAllRead() {
    const done = await markAllRead()
    if (!done) toast('Could not mark notifications as read.', 'error')
  }

  if (!eligible) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  const crumb = unread ? `${unread} unread` : 'You are all caught up'
  const backTo = backPath(location.state?.from, homePathForUser(user))

  return (
    <>
      <PageMeta pageId="notifications" title="Notifications" crumb={crumb} />

      <main className="page">
        <Link className="back-link" to={backTo}>
          ← Back
        </Link>

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <Tabs
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread', count: unread },
          ]}
          value={tab}
          onChange={handleTabChange}
        />

        <Panel
          title={tab === 'unread' ? 'Unread notifications' : 'All notifications'}
          subtitle="Newest first"
          actions={
            unread > 0 ? (
              <Button size="sm" onClick={handleMarkAllRead} disabled={pushBusy}>
                Mark all read
              </Button>
            ) : null
          }
          flush
        >
          <div className="notification-list notification-page-list" aria-live="polite" aria-busy={loading}>
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <div key={i} className="notification-item notification-item-skeleton">
                    <SkeletonText lines={3} />
                  </div>
                ))
              : null}
            {!loading && !rows.length && !loadError ? (
              tab === 'unread' ? (
                <EmptyState title="No unread notifications">You have read every notification.</EmptyState>
              ) : (
                <EmptyState title="No notifications yet">New ticket alerts will appear here.</EmptyState>
              )
            ) : null}
            {!loading
              ? rows.map((item) => (
                  <NotificationItem key={item.id} item={item} onOpen={(next) => void openNotification(next)} />
                ))
              : null}
          </div>
          <TablePagination
            page={pagination.page || page}
            limit={limit}
            total={pagination.total || 0}
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
