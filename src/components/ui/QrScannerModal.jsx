import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from './Button'
import { Modal } from './Modal'

const SCAN_CONFIG = { fps: 8, qrbox: { width: 220, height: 220 } }

/**
 * Invert RGB on the scan canvas (Safari-safe; no CSS filter).
 * Parking stickers are often white modules on black — html5-qrcode only
 * decodes dark-on-light unless we flip the frame first.
 * @param {CanvasRenderingContext2D | null | undefined} ctx
 * @param {HTMLCanvasElement | null | undefined} canvas
 */
function invertScanCanvas(ctx, canvas) {
  if (!ctx || !canvas?.width || !canvas?.height) return
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255 - pixels[i]
    pixels[i + 1] = 255 - pixels[i + 1]
    pixels[i + 2] = 255 - pixels[i + 2]
  }
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Same as Html5Qrcode, but retries each frame with inverted colors so
 * white-on-black sticker QR codes decode.
 */
class InvertAwareHtml5Qrcode extends Html5Qrcode {
  scanContext(qrCodeSuccessCallback, qrCodeErrorCallback) {
    return super.scanContext(qrCodeSuccessCallback, qrCodeErrorCallback).then((ok) => {
      if (ok) return true
      invertScanCanvas(this.context, this.canvasElement)
      return super.scanContext(qrCodeSuccessCallback, qrCodeErrorCallback)
    })
  }
}

/**
 * @param {unknown} err
 */
function isPermissionDenied(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : ''
  const text = `${name} ${raw}`.toLowerCase()
  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    text.includes('notallowed') ||
    text.includes('permission denied')
  )
}

/**
 * Map getUserMedia / html5-qrcode failures to short user-facing copy.
 * @param {unknown} err
 */
function cameraStartErrorMessage(err) {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : ''
  const text = `${name} ${raw}`.toLowerCase()

  if (isPermissionDenied(err)) {
    return 'Camera permission denied. Allow camera access in the browser settings, then try again.'
  }
  if (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    text.includes('notfound') ||
    text.includes('no camera') ||
    text.includes('requested device not found')
  ) {
    return 'No camera found. Type the QR Number instead.'
  }
  if (text.includes('secure') || text.includes('https')) {
    return 'Camera needs a secure page. Open the app via HTTPS or localhost.'
  }
  return 'Camera could not be started. Check browser permissions or type the QR Number instead.'
}

/**
 * Camera QR scanner dialog. Starts on open; stops on close / successful decode.
 * Tries rear camera, then front, then the first listed device (desktop-friendly).
 * Supports inverted (white-on-black) sticker QR codes.
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
    const scanner = new InvertAwareHtml5Qrcode(readerId)
    scannerRef.current = scanner

    function onDecoded(decoded) {
      if (handledRef.current || cancelled) return
      handledRef.current = true
      onScanRef.current(decoded)
      onCloseRef.current()
    }

    /**
     * @param {string | MediaTrackConstraints} cameraIdOrConfig
     */
    async function tryStart(cameraIdOrConfig) {
      await scanner.start(cameraIdOrConfig, SCAN_CONFIG, onDecoded, () => {})
    }

    async function start() {
      setBusy(true)
      setError('')

      // if (typeof window !== 'undefined' && window.isSecureContext === false) {
      //   setError('Camera needs a secure page. Open the app via HTTPS or localhost.')
      //   setBusy(false)
      //   return
      // }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not available in this browser. Type the QR Number instead.')
        setBusy(false)
        return
      }

      /** @type {unknown} */
      let lastErr = null
      const attempts = [{ facingMode: 'environment' }, { facingMode: 'user' }]

      for (const config of attempts) {
        if (cancelled) return
        try {
          await tryStart(config)
          if (!cancelled) setBusy(false)
          return
        } catch (err) {
          lastErr = err
          if (isPermissionDenied(err)) break
        }
      }

      if (cancelled) return

      if (!isPermissionDenied(lastErr)) {
        try {
          const cameras = await Html5Qrcode.getCameras()
          if (cancelled) return
          if (cameras?.length) {
            await tryStart(cameras[0].id)
            if (!cancelled) setBusy(false)
            return
          }
        } catch (err) {
          lastErr = err
        }
      }

      if (cancelled) return
      setError(cameraStartErrorMessage(lastErr))
      setBusy(false)
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
