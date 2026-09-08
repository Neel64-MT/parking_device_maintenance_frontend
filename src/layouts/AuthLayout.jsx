import { Outlet } from 'react-router-dom'

const AUTH_LOGO_SRC = '/auth-logo.png'

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <img
            className="auth-logo"
            src={AUTH_LOGO_SRC}
            alt="PDM — Parking Device Management"
            width={320}
            height={156}
            decoding="async"
          />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
