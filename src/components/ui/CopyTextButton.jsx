import { toast } from '../../context/ToastContext'

function CopyIcon() {
  return (
    <svg
      className="ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

async function writeClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('copy failed')
}

/**
 * Small icon button that copies `text` to the clipboard.
 * Renders nothing when `text` is empty.
 */
export function CopyTextButton({ text, 'aria-label': ariaLabel = 'Copy' }) {
  const value = text == null ? '' : String(text).trim()
  if (!value) return null

  async function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await writeClipboard(value)
      toast('Copied', 'success')
    } catch {
      toast('Could not copy', 'error')
    }
  }

  return (
    <button type="button" className="btn-copy" aria-label={ariaLabel} onClick={handleClick}>
      <CopyIcon />
    </button>
  )
}
