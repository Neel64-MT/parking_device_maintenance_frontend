/* Context modules export hooks alongside providers — expected pattern. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ToastContext = createContext(null)

const TYPE_ALIASES = {
  success: 'success',
  ok: 'success',
  error: 'error',
  danger: 'error',
  bad: 'error',
  warning: 'warning',
  warn: 'warning',
  info: 'info',
}

const TOAST_MS = {
  default: 1000,
  success: 1000,
  info: 1000,
  error: 3000,
  warning: 3000,
}

function normalizeType(typeOrOpts) {
  let raw = ''
  if (typeof typeOrOpts === 'string') {
    raw = typeOrOpts
  } else if (typeOrOpts && typeof typeOrOpts === 'object') {
    raw = typeOrOpts.type || typeOrOpts.variant || ''
  }
  return TYPE_ALIASES[String(raw).toLowerCase()] || 'default'
}

/** Module-level bridge so toast() works outside React components (like original app.js). */
let toastImpl = (msg) => {
  console.warn('toast called before ToastProvider mounted:', msg)
}

/** @param {string} msg @param {string|{type?: string, variant?: string}} [typeOrOpts] */
export function toast(msg, typeOrOpts) {
  toastImpl(msg, typeOrOpts)
}

/** Success toast for API mutations. */
export function toastApiSuccess(msg) {
  toast(msg, 'success')
}

/**
 * Error toast for API failures — prefers ApiRequestError.message, else fallback.
 * @param {unknown} err
 * @param {string} fallback
 */
export function toastApiError(err, fallback) {
  const message =
    err && typeof err === 'object' && 'message' in err && err.message
      ? String(err.message)
      : fallback
  toast(message || fallback || 'Something went wrong.', 'error')
}

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const [type, setType] = useState('default')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, typeOrOpts) => {
    const nextType = normalizeType(typeOrOpts)
    setMessage(String(msg ?? ''))
    setType(nextType)
    setVisible(false)
    requestAnimationFrame(() => {
      setVisible(true)
    })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), TOAST_MS[nextType] ?? TOAST_MS.default)
  }, [])

  useEffect(() => {
    toastImpl = showToast
    return () => {
      toastImpl = (msg) => console.warn('toast called after ToastProvider unmounted:', msg)
      clearTimeout(timerRef.current)
    }
  }, [showToast])

  const value = useMemo(() => ({ toast: showToast }), [showToast])

  const typeClass = type !== 'default' ? ` toast-${type}` : ''
  const isError = type === 'error'

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`toast${typeClass}${visible ? ' show' : ''}`}
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
