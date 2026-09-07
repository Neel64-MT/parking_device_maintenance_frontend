import { useEffect } from 'react'

/**
 * Simple modal dialog — overlay + surface panel.
 * Escape / overlay click closes when onClose is provided (unless gated off).
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
}) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape' && closeOnEscape && !closeDisabled) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-lock')
    }
  }, [open, onClose, closeOnEscape, closeDisabled])

  if (!open) return null

  function requestClose() {
    if (closeDisabled) return
    onClose?.()
  }

  return (
    <div className="modal-root" role="presentation">
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
            {title ? (
              <h3 id="modal-title">{title}</h3>
            ) : null}
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
