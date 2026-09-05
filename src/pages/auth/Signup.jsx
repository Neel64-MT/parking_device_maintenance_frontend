import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiRequestError } from '../../services/api'
import * as authApi from '../../services/auth'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'
import { PasswordInput } from '../../components/ui/PasswordInput'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!fullName.trim() || !mobile.trim() || !email.trim() || !password) {
      setError('Fill in all required fields.')
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
      await authApi.signup({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        password,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not submit signup. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Panel title="Request received" subtitle="Your account is waiting for admin approval">
        <div className="hint-strip" style={{ marginBottom: 16 }}>
          <span>
            Please ask the admin to approve your request. You will be able to sign in once your
            account is Active.
          </span>
        </div>
        <div className="auth-actions">
          <Link className="btn btn-primary" to="/login">
            Back to sign in
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title="Sign up"
      subtitle="Request an account — an Admin must approve before you can sign in"
    >
      {error ? (
        <div className="hint-strip auth-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Full name" required>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ramesh Vaghela"
          />
        </Field>
        <Field label="Mobile number" required hint="Also used as a login ID.">
          <input
            type="tel"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit number"
          />
        </Field>
        <Field label="Email" required hint="Used for password reset.">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" required hint="At least 8 characters.">
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
          />
        </Field>
        <Field label="Confirm password" required>
          <PasswordInput
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
          />
        </Field>
        <div className="auth-actions">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Request account'}
          </Button>
        </div>
      </form>

      <p className="auth-footer muted">
        Already have an account? <Link className="auth-link" to="/login">Sign in</Link>
      </p>
    </Panel>
  )
}
