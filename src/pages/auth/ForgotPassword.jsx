import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../../services/api'
import * as authApi from '../../services/auth'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'

const GENERIC_OK =
  'If an account exists for this email, a password reset link has been sent.'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Enter the email on your account.')
      return
    }

    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not send reset link. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Panel title="Check your email" subtitle="Password reset">
        <div className="hint-strip" style={{ marginBottom: 16 }}>
          <span>{GENERIC_OK}</span>
        </div>
        <p className="muted" style={{ marginBottom: 18 }}>
          In local development without SMTP, the reset link is printed in the backend console.
        </p>
        <div className="auth-actions">
          <Link className="btn btn-primary" to="/login">
            Back to sign in
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Forgot password" subtitle="Enter the email registered on your account">
      {error ? (
        <div className="hint-strip auth-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Email" required>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <div className="auth-actions">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
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
