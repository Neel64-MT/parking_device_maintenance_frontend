import { Outlet } from 'react-router-dom'
import { APP } from '../config/nav'

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="mark">
            <div className="glyph">P</div>
            <h1>
              {APP.nameLines[0]}
              <br />
              {APP.nameLines[1]}
            </h1>
          </div>
          <p>{APP.sub}</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
