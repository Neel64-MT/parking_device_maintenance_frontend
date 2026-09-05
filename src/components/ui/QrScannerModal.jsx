import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * Camera QR scanner dialog. Starts on open; stops on close / successful decode.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onScan: (text: string) => void,
 *   title?: string,
 *   subtitle?: string,
 * }} props
 */
export function QrScannerModal({
  open,
  onClose,
  onScan,
  title = 'Scan QR',
  subtitle = 'Point the camera at the sticker on the machine',
}) {
  const reactId = useId()
  const readerId = `qr-reader-${reactId.replace(/:/g, '')}`
  const scannerRef = useRef(null)
  const handledRef = useRef(false)
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
    onCloseRef.current = onClose
  }, [onScan, onClose])

  useEffect(() => {
    if (!open) return undefined

    handledRef.current = false
    let cancelled = false
    const scanner = new Html5Qrcode(readerId)
    scannerRef.current = scanner

    async function start() {
      setBusy(true)
      setError('')
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (handledRef.current || cancelled) return
            handledRef.current = true
            onScanRef.current(decoded)
            onCloseRef.current()
          },
          () => {},
        )
      } catch (err) {
        if (cancelled) return
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera could not be started. Check browser permissions.'
        setError(msg)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    start()

    return () => {
      cancelled = true
      const active = scannerRef.current
      scannerRef.current = null
      if (active) {
        active
          .stop()
          .then(() => active.clear())
          .catch(() => {})
      }
    }
  }, [open, readerId])

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onClose} wide>
      {error ? (
        <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 12 }}>
          <span>{error}</span>
        </div>
      ) : null}
      {busy && !error ? (
        <p className="muted" style={{ marginBottom: 12 }}>
          Starting camera…
        </p>
      ) : null}
      <div id={readerId} className="qr-scanner-mount" />
      <div className="form-actions" style={{ marginTop: 16 }}>
        <Button type="button" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
