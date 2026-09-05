import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ApiRequestError } from '../../services/api'
import { homePathForUser, isDashboardRole } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'
import { PasswordInput } from '../../components/ui/PasswordInput'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const id = identifier.trim()
    if (!id || !password) {
      setError('Enter your email or mobile and password.')
      return
    }

    setSubmitting(true)
    try {
      const user = await login(id, password)
      const from = location.state?.from
      const home = homePathForUser(user)
      const deepLink =
        from && from !== '/login' && from !== '/' && !(from === '/dashboard' && !isDashboardRole(user))
      navigate(deepLink ? from : home, { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Could not sign in. Try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Sign in" subtitle="Use your email or mobile number and password">
      {location.state?.resetOk ? (
        <div className="hint-strip" style={{ marginBottom: 12 }} role="status">
          <span>Password updated. Sign in with your new password.</span>
        </div>
      ) : null}

      {error ? (
        <div className="hint-strip auth-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Email or mobile" required>
          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. 9825012345 or you@example.com"
          />
        </Field>
        <Field label="Password" required>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </Field>
        <p className="auth-footer muted" style={{ marginTop: 0, marginBottom: 14 }}>
          <Link className="auth-link" to="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <div className="auth-actions">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>

      <p className="auth-footer muted">
        Need an account? <Link className="auth-link" to="/signup">Sign up</Link>
      </p>
    </Panel>
  )
}
