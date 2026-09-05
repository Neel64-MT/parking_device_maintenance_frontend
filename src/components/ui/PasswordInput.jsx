import { useState } from 'react'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true">
        <path
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 8.5 3.4 10 7-.4 1-1 2-1.8 2.9M6.1 6.1C4.2 7.4 2.8 9.2 2 12c1.5 3.6 5 7 10 7a10 10 0 0 0 4.2-.9"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="1.7" />
    </svg>
  )
}

/**
 * Password field with show/hide toggle (eye icon).
 * Drop-in for <input type="password" ... />.
 */
export function PasswordInput({ className = '', disabled, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`password-field${className ? ` ${className}` : ''}`}>
      <input type={visible ? 'text' : 'password'} disabled={disabled} {...rest} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
        disabled={disabled}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  )
}
