import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GearLoader } from '../components/ui/GearLoader'
import { homePathForUser } from '../services/users'
import { AuthBootSkeleton } from '../components/ui/Skeleton'

/**
 * Shared 404 for unknown routes (guest or signed-in).
 */
export default function NotFound() {
  const { user, loading } = useAuth()

  useEffect(() => {
    document.title = 'Page not found'
  }, [])

  if (loading) {
    return <AuthBootSkeleton />
  }

  const homeTo = user ? homePathForUser(user) : '/login'
  const homeLabel = user ? 'Back to home' : 'Back to sign in'

  return (
    <div className="not-found-shell">
      <div className="not-found-inner">
        <GearLoader />
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-copy muted">
          This address is not part of the app. Check the link or go back to a known screen.
        </p>
        <Link className="btn btn-primary" to={homeTo}>
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}
