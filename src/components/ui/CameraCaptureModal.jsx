import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

const MIN_CROP = 0.12
const DEFAULT_CROP = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 }

function stopMediaStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((t) => t.stop())
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function normalizeCrop(next) {
  let { x, y, w, h } = next
  w = clamp(w, MIN_CROP, 1)
  h = clamp(h, MIN_CROP, 1)
  x = clamp(x, 0, 1 - w)
  y = clamp(y, 0, 1 - h)
  return { x, y, w, h }
}

/**
 * Live camera capture → crop/review → Upload or Recapture.
 * Captures a still as a JPEG File (same local path as folder pick).
 * Mount only while open so state resets cleanly between sessions.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onCapture: (file: File) => void,
 * }} props
 */
export function CameraCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const imgRef = useRef(null)
  const dragRef = useRef(null)
  const detachDragRef = useRef(null)
  const previewUrlRef = useRef('')

  const [facing, setFacing] = useState('environment')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [canFlip, setCanFlip] = useState(false)
  const [step, setStep] = useState('camera')
  const [previewUrl, setPreviewUrl] = useState('')
  const [crop, setCrop] = useState(DEFAULT_CROP)
  const [exporting, setExporting] = useState(false)

  function revokePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setPreviewUrl('')
  }

  function handleClose() {
    stopMediaStream(streamRef.current)
    streamRef.current = null
    revokePreview()
    onClose()
  }

  useEffect(() => {
    if (!open || step !== 'camera') return undefined

    let cancelled = false
    const videoEl = videoRef.current

    async function start(mode) {
      setBusy(true)
      setError('')
      stopMediaStream(streamRef.current)
      streamRef.current = null
      if (videoEl) videoEl.srcObject = null

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not available in this browser. Choose from folder instead.')
        setBusy(false)
        return
      }

      try {
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { exact: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
        }

        if (cancelled) {
          stopMediaStream(stream)
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }

        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const cams = devices.filter((d) => d.kind === 'videoinput')
          if (!cancelled) setCanFlip(cams.length > 1)
        } catch {
          if (!cancelled) setCanFlip(true)
        }
      } catch (err) {
        if (cancelled) return
        const name = err && typeof err === 'object' ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Camera permission denied. Allow camera access or choose from folder.')
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setError('No camera found. Choose from folder instead.')
        } else {
          setError('Camera could not be started. Try again or choose from folder.')
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    start(facing)

    return () => {
      cancelled = true
      stopMediaStream(streamRef.current)
      streamRef.current = null
      if (videoEl) videoEl.srcObject = null
    }
  }, [open, facing, step])

  useEffect(() => {
    return () => {
      detachDragRef.current?.()
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = ''
      }
    }
  }, [])

  function flipCamera() {
    setFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  function takePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      setError('Camera is not ready yet. Wait a moment and try again.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Could not capture photo.')
      return
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not capture photo.')
          return
        }
        stopMediaStream(streamRef.current)
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null

        revokePreview()
        const url = URL.createObjectURL(blob)
        previewUrlRef.current = url
        setPreviewUrl(url)
        setCrop(DEFAULT_CROP)
        setError('')
        setStep('review')
      },
      'image/jpeg',
      0.92,
    )
  }

  function recapture() {
    revokePreview()
    setCrop(DEFAULT_CROP)
    setExporting(false)
    setError('')
    setStep('camera')
  }

  function endDrag() {
    dragRef.current = null
  }

  function onCropPointerDown(e, mode, corner) {
    if (!imgRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const imgRect = imgRef.current.getBoundingClientRect()
    if (!imgRect.width || !imgRect.height) return

    dragRef.current = {
      mode,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      imgW: imgRect.width,
      imgH: imgRect.height,
    }

    function onMove(ev) {
      const d = dragRef.current
      if (!d) return
      const dx = (ev.clientX - d.startX) / d.imgW
      const dy = (ev.clientY - d.startY) / d.imgH
      const s = d.startCrop

      if (d.mode === 'move') {
        setCrop(normalizeCrop({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }))
        return
      }

      let { x, y, w, h } = s
      if (d.corner === 'nw') {
        const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP)
        const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP)
        w = s.w + (s.x - nx)
        h = s.h + (s.y - ny)
        x = nx
        y = ny
      } else if (d.corner === 'ne') {
        const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP)
        w = clamp(s.w + dx, MIN_CROP, 1 - s.x)
        h = s.h + (s.y - ny)
        y = ny
      } else if (d.corner === 'sw') {
        const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP)
        w = s.w + (s.x - nx)
        h = clamp(s.h + dy, MIN_CROP, 1 - s.y)
        x = nx
      } else if (d.corner === 'se') {
        w = clamp(s.w + dx, MIN_CROP, 1 - s.x)
        h = clamp(s.h + dy, MIN_CROP, 1 - s.y)
      }
      setCrop(normalizeCrop({ x, y, w, h }))
    }

    function onUp() {
      detachDragRef.current?.()
    }

    detachDragRef.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      detachDragRef.current = null
      endDrag()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function confirmUpload() {
    const img = imgRef.current
    if (!img?.naturalWidth || !img.naturalHeight) {
      setError('Photo is not ready yet. Try again.')
      return
    }

    setExporting(true)
    setError('')

    const sx = Math.round(crop.x * img.naturalWidth)
    const sy = Math.round(crop.y * img.naturalHeight)
    const sw = Math.max(1, Math.round(crop.w * img.naturalWidth))
    const sh = Math.max(1, Math.round(crop.h * img.naturalHeight))

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setExporting(false)
      setError('Could not crop photo.')
      return
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setExporting(false)
          setError('Could not prepare photo for upload.')
          return
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        revokePreview()
        onCapture(file)
        onClose()
      },
      'image/jpeg',
      0.92,
    )
  }

  if (!open) return null

  const isReview = step === 'review'

  return (
    <Modal
      open={open}
      title={isReview ? 'Crop photo' : 'Capture photo'}
      subtitle={
        isReview
          ? 'Drag the box to crop, then upload or recapture'
          : 'Use the rear or front camera, then take a photo'
      }
      onClose={handleClose}
      closeOnEscape={!isReview}
      closeDisabled={exporting}
      wide
    >
      {error ? (
        <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 12 }}>
          <span>{error}</span>
        </div>
      ) : null}

      {!isReview && busy && !error ? (
        <p className="muted" style={{ marginBottom: 12 }}>
          Starting camera…
        </p>
      ) : null}

      {isReview ? (
        <div className="camera-crop-stage">
          <div className="camera-crop-frame">
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Captured photo"
              className="camera-crop-image"
              draggable={false}
            />
            <div
              className="camera-crop-box"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
              onPointerDown={(e) => onCropPointerDown(e, 'move')}
            >
              <span
                className="camera-crop-handle nw"
                onPointerDown={(e) => onCropPointerDown(e, 'resize', 'nw')}
              />
              <span
                className="camera-crop-handle ne"
                onPointerDown={(e) => onCropPointerDown(e, 'resize', 'ne')}
              />
              <span
                className="camera-crop-handle sw"
                onPointerDown={(e) => onCropPointerDown(e, 'resize', 'sw')}
              />
              <span
                className="camera-crop-handle se"
                onPointerDown={(e) => onCropPointerDown(e, 'resize', 'se')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="camera-capture-mount">
          <video
            ref={videoRef}
            className="camera-capture-video"
            playsInline
            muted
            autoPlay
          />
          <button
            type="button"
            className="camera-flip-btn"
            onClick={flipCamera}
            disabled={!!error || busy || !canFlip}
            title={canFlip ? 'Switch front / rear camera' : 'Only one camera available'}
            aria-label={
              facing === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'
            }
          >
            <svg
              className="camera-flip-ico"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.25 6.75 9.5 4.75h5l1.25 2H18a1.75 1.75 0 0 1 1.75 1.75v9a1.75 1.75 0 0 1-1.75 1.75H6A1.75 1.75 0 0 1 4.25 17.5v-9A1.75 1.75 0 0 1 6 6.75h2.25z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M14.6 10.15A3.1 3.1 0 0 0 9.7 11.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="m9.55 10.05-.35 2.05 2.05-.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.4 14.35a3.1 3.1 0 0 0 4.9-1.25"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="m14.45 14.45.35-2.05-2.05.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="camera-capture-actions">
        {isReview ? (
          <>
            <Button type="button" size="sm" onClick={handleClose} disabled={exporting}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={recapture} disabled={exporting}>
              Recapture
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={confirmUpload}
              disabled={exporting || !previewUrl}
            >
              {exporting ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={takePhoto}
              disabled={!!error || busy}
            >
              Take photo
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
