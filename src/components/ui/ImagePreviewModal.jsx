import { useRef, useState } from 'react'
import { Modal } from './Modal'

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25
/** Default hover magnification (Amazon-style explore). */
const HOVER_ZOOM = 2.25

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M8 11h6" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  )
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
    </svg>
  )
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function roundZoom(z) {
  return Math.round(z * 100) / 100
}

/**
 * Shopping-style image gallery: large image + thumbnails.
 * Desktop: hover zooms toward the pointer (Amazon-style explore).
 * Mobile: pinch-to-zoom + drag pan. Rotate / button zoom preserved.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   images?: string[],
 *   title?: string,
 * }} props
 */
export function ImagePreviewModal({ open, onClose, images = [], title = 'Images' }) {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const pinchRef = useRef(null)
  const pointersRef = useRef(new Map())
  const zoomRef = useRef(ZOOM_MIN)
  const panRef = useRef({ x: 0, y: 0 })
  const hoverZoomActiveRef = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [dragging, setDragging] = useState(false)

  const list = Array.isArray(images) ? images.filter(Boolean) : []

  if (!open || !list.length) return null

  const safeIndex = Math.min(Math.max(activeIndex, 0), list.length - 1)
  const main = list[safeIndex]
  const sideways = rotation % 180 !== 0
  const canZoomOut = zoom > ZOOM_MIN
  const canZoomIn = zoom < ZOOM_MAX
  const canPan = zoom > ZOOM_MIN

  function syncZoom(next) {
    zoomRef.current = next
    setZoom(next)
  }

  function syncPan(next) {
    panRef.current = next
    setPan(next)
  }

  function resetView() {
    hoverZoomActiveRef.current = false
    syncZoom(ZOOM_MIN)
    setRotation(0)
    syncPan({ x: 0, y: 0 })
    setOrigin({ x: 50, y: 50 })
  }

  function selectThumb(i) {
    setActiveIndex(i)
    resetView()
  }

  function panLimits(stageEl, nextZoom = zoomRef.current) {
    if (!stageEl || nextZoom <= ZOOM_MIN) return { maxX: 0, maxY: 0 }
    const rect = stageEl.getBoundingClientRect()
    const maxX = (rect.width * (nextZoom - 1)) / 2
    const maxY = (rect.height * (nextZoom - 1)) / 2
    return { maxX, maxY }
  }

  function clampPan(x, y, nextZoom = zoomRef.current) {
    const { maxX, maxY } = panLimits(stageRef.current, nextZoom)
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
  }

  function setOriginFromPointer(clientX, clientY) {
    const stage = stageRef.current
    if (!stage) return { x: 50, y: 50 }
    const rect = stage.getBoundingClientRect()
    if (!rect.width || !rect.height) return { x: 50, y: 50 }
    const ox = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
    const oy = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    setOrigin({ x: ox, y: oy })
    return { x: ox, y: oy }
  }

  /**
   * Pointer-position explore: keep the region under the cursor in view.
   */
  function panFromPointer(clientX, clientY, nextZoom = zoomRef.current) {
    const stage = stageRef.current
    if (!stage || nextZoom <= ZOOM_MIN) return
    const rect = stage.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = (clientX - rect.left) / rect.width
    const ny = (clientY - rect.top) / rect.height
    const { maxX, maxY } = panLimits(stage, nextZoom)
    syncPan({
      x: clamp((0.5 - nx) * 2 * maxX, -maxX, maxX),
      y: clamp((0.5 - ny) * 2 * maxY, -maxY, maxY),
    })
  }

  function zoomOut() {
    hoverZoomActiveRef.current = false
    const next = Math.max(ZOOM_MIN, roundZoom(zoomRef.current - ZOOM_STEP))
    syncZoom(next)
    if (next <= ZOOM_MIN) {
      syncPan({ x: 0, y: 0 })
      setOrigin({ x: 50, y: 50 })
    } else {
      syncPan(clampPan(panRef.current.x, panRef.current.y, next))
    }
  }

  function zoomIn() {
    hoverZoomActiveRef.current = false
    const next = Math.min(ZOOM_MAX, roundZoom(zoomRef.current + ZOOM_STEP))
    syncZoom(next)
    syncPan(clampPan(panRef.current.x, panRef.current.y, next))
  }

  function rotate() {
    hoverZoomActiveRef.current = false
    setRotation((r) => (r + 90) % 360)
    syncPan({ x: 0, y: 0 })
  }

  function pointerDistance(a, b) {
    const dx = a.clientX - b.clientX
    const dy = a.clientY - b.clientY
    return Math.hypot(dx, dy)
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()]
      pinchRef.current = {
        startDist: pointerDistance(pts[0], pts[1]),
        startZoom: zoomRef.current,
      }
      dragRef.current = null
      setDragging(false)
      return
    }

    if (zoomRef.current > ZOOM_MIN) {
      dragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: panRef.current.x,
        originY: panRef.current.y,
        moved: false,
      }
      setDragging(true)
    }
  }

  function onPointerMove(e) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY })
    }

    // Pinch zoom (touch)
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()]
      const dist = pointerDistance(pts[0], pts[1])
      if (pinchRef.current.startDist > 0) {
        const ratio = dist / pinchRef.current.startDist
        const next = clamp(roundZoom(pinchRef.current.startZoom * ratio), ZOOM_MIN, ZOOM_MAX)
        syncZoom(next)
        if (next <= ZOOM_MIN) syncPan({ x: 0, y: 0 })
        else syncPan(clampPan(panRef.current.x, panRef.current.y, next))
      }
      return
    }

    const drag = dragRef.current
    if (drag && drag.id === e.pointerId && zoomRef.current > ZOOM_MIN) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true
      syncPan(clampPan(drag.originX + dx, drag.originY + dy))
      return
    }

    // Desktop hover: Amazon-style zoom toward pointer
    if (e.pointerType === 'mouse' && !drag) {
      setOriginFromPointer(e.clientX, e.clientY)
      if (!hoverZoomActiveRef.current && zoomRef.current <= ZOOM_MIN) {
        hoverZoomActiveRef.current = true
        syncZoom(HOVER_ZOOM)
      }
      const z = zoomRef.current > ZOOM_MIN ? zoomRef.current : HOVER_ZOOM
      panFromPointer(e.clientX, e.clientY, z)
    }
  }

  function onPointerUp(e) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (dragRef.current?.id === e.pointerId) {
      dragRef.current = null
      setDragging(false)
    }
  }

  function onPointerLeave() {
    // Drop hover magnification when the cursor leaves (keep button zoom).
    if (hoverZoomActiveRef.current) {
      hoverZoomActiveRef.current = false
      syncZoom(ZOOM_MIN)
      syncPan({ x: 0, y: 0 })
      setOrigin({ x: 50, y: 50 })
    }
  }

  const subtitle = canPan
    ? 'Hover or pinch to zoom · Drag to explore · Tap a thumbnail to change'
    : 'Hover to zoom on desktop · Pinch on mobile · Tap a thumbnail to change'

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onClose} wide>
      <div className="img-preview">
        <div
          ref={stageRef}
          className={`img-preview-main${canPan ? ' is-zoomable' : ''}${dragging ? ' is-dragging' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerLeave}
        >
          <img
            src={main}
            alt={`Image ${safeIndex + 1} of ${list.length}`}
            className={sideways ? 'is-sideways' : undefined}
            draggable={false}
            style={{
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
            }}
          />
        </div>
        <div className="img-preview-controls" role="toolbar" aria-label="Image controls">
          <button
            type="button"
            className="btn btn-sm img-preview-ctrl"
            onClick={zoomOut}
            disabled={!canZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOutIcon />
          </button>
          <button
            type="button"
            className="btn btn-sm img-preview-ctrl"
            onClick={zoomIn}
            disabled={!canZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomInIcon />
          </button>
          <button
            type="button"
            className="btn btn-sm img-preview-ctrl"
            onClick={resetView}
            disabled={zoom <= ZOOM_MIN && rotation === 0}
            title="Reset"
            aria-label="Reset zoom and rotation"
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            className="btn btn-sm img-preview-ctrl"
            onClick={rotate}
            title="Rotate"
            aria-label="Rotate"
          >
            <RotateIcon />
          </button>
        </div>
        {list.length > 1 ? (
          <div className="img-preview-thumbs" role="list">
            {list.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                role="listitem"
                className={`img-preview-thumb${i === safeIndex ? ' is-active' : ''}`}
                onClick={() => selectThumb(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === safeIndex ? 'true' : undefined}
              >
                <img src={src} alt="" draggable={false} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
