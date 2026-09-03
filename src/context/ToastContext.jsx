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

/** Module-level bridge so toast() works outside React components (like original app.js). */
let toastImpl = (msg) => {
  console.warn('toast called before ToastProvider mounted:', msg)
}

export function toast(msg) {
  toastImpl(msg)
}

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const showToast = useCallback((msg) => {
    setMessage(String(msg ?? ''))
    setVisible(false)
    requestAnimationFrame(() => {
      setVisible(true)
    })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 2600)
  }, [])

  useEffect(() => {
    toastImpl = showToast
    return () => {
      toastImpl = (msg) => console.warn('toast called after ToastProvider unmounted:', msg)
      clearTimeout(timerRef.current)
    }
  }, [showToast])

  const value = useMemo(() => ({ toast: showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
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
