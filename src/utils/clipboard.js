function copyWithTextarea(text) {
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
 * Copy text to the clipboard. Falls back to execCommand when the Clipboard API is missing
 * (plain-http hosts) or refuses the write (permission denied in embedded browsers).
 */
export async function writeClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      copyWithTextarea(text)
      return
    }
  }
  copyWithTextarea(text)
}
