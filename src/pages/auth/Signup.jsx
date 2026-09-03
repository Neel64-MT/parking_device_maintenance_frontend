import { Link } from 'react-router-dom'
import { Panel } from '../../components/ui/Panel'

export default function Signup() {
  return (
    <Panel
      title="Need an account?"
      subtitle="Accounts are created by an Admin — there is no self-registration"
    >
      <div className="hint-strip" style={{ marginBottom: 16 }}>
        <span>
          Ask your project manager or Admin to add you on the <b>Users</b> screen with your name,
          mobile number, and email. Ticket alerts go to your mobile.
        </span>
      </div>

      <p className="muted" style={{ marginBottom: 18 }}>
        Once your account is active, sign in with your email or mobile and the password they set for
        you.
      </p>

      <div className="auth-actions">
        <Link className="btn btn-primary" to="/login">
          Back to sign in
        </Link>
      </div>
    </Panel>
  )
}
