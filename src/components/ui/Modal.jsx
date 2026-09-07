import { useEffect, useRef } from 'react'

/**
 * Simple modal dialog — overlay + surface panel.
 * Escape / overlay click closes when onClose is provided (unless gated off).
 * Portaled camera overlays use `elevated` so they stack above Add Update.
 */
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  closeOnEscape = true,
  closeDisabled = false,
  elevated = false,
}) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key !== 'Escape' || !closeOnEscape || closeDisabled) return
      // Only the topmost open dialog handles Escape (camera above Add Update).
      const roots = document.querySelectorAll('.modal-root')
      const top = roots[roots.length - 1]
      if (top && rootRef.current && top !== rootRef.current) return
      onClose?.()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      // Keep lock while another dialog (e.g. Add Update under camera) is still open.
      requestAnimationFrame(() => {
        if (!document.querySelector('.modal-root')) {
          document.body.classList.remove('modal-lock')
        }
      })
    }
  }, [open, onClose, closeOnEscape, closeDisabled])

  if (!open) return null

  function requestClose() {
    if (closeDisabled) return
    onClose?.()
  }

  return (
    <div
      ref={rootRef}
      className={`modal-root${elevated ? ' modal-root--elevated' : ''}`}
      role="presentation"
    >
      <button
        type="button"
        className="modal-scrim"
        aria-label="Close dialog"
        onClick={requestClose}
        disabled={closeDisabled}
      />
      <div
        className={`modal-dialog${wide ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="modal-head">
          <div>
            {title ? <h3 id="modal-title">{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {onClose ? (
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={requestClose}
              disabled={closeDisabled}
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
