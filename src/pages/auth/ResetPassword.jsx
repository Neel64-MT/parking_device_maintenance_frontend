import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiRequestError } from '../../services/api'
import * as authApi from '../../services/auth'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'
import { PasswordInput } from '../../components/ui/PasswordInput'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token') || '', [params])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is missing a token. Request a new link from Forgot password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword(token, password)
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not reset password. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="Set new password" subtitle="Choose a password for your account">
      {error ? (
        <div className="hint-strip auth-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {!token ? (
        <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
          <span>Invalid reset link. Request a new one from Forgot password.</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="New password" required hint="At least 8 characters.">
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            disabled={!token}
          />
        </Field>
        <Field label="Confirm password" required>
          <PasswordInput
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            disabled={!token}
          />
        </Field>
        <div className="auth-actions">
          <Button type="submit" variant="primary" disabled={submitting || !token}>
            {submitting ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </form>

      <p className="auth-footer muted">
        <Link className="auth-link" to="/login">
          Back to sign in
        </Link>
      </p>
    </Panel>
  )
}
