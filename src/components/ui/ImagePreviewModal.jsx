import { useRef, useState } from 'react'
import { Modal } from './Modal'

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

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

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Shopping-style image gallery: one large image + selectable thumbnails.
 * Zoom / rotate / pan are view-only CSS transforms (do not modify the source file).
 * When zoomed, move or drag over the image to explore (magnifier-style scroll).
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

  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  const list = Array.isArray(images) ? images.filter(Boolean) : []

  if (!open || !list.length) return null

  const safeIndex = Math.min(Math.max(activeIndex, 0), list.length - 1)
  const main = list[safeIndex]
  const sideways = rotation % 180 !== 0
  const canZoomOut = zoom > ZOOM_MIN
  const canZoomIn = zoom < ZOOM_MAX
  const canPan = zoom > ZOOM_MIN

  function resetView() {
    setZoom(ZOOM_MIN)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  function selectThumb(i) {
    setActiveIndex(i)
    resetView()
  }

  /** Max translate so the zoomed image can still cover the stage edges. */
  function panLimits(stageEl, nextZoom = zoom) {
    if (!stageEl || nextZoom <= ZOOM_MIN) return { maxX: 0, maxY: 0 }
    const rect = stageEl.getBoundingClientRect()
    const maxX = (rect.width * (nextZoom - 1)) / 2
    const maxY = (rect.height * (nextZoom - 1)) / 2
    return { maxX, maxY }
  }

  function clampPan(x, y, nextZoom = zoom) {
    const { maxX, maxY } = panLimits(stageRef.current, nextZoom)
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
  }

  function zoomOut() {
    const next = Math.max(ZOOM_MIN, Math.round((zoom - ZOOM_STEP) * 100) / 100)
    setZoom(next)
    if (next <= ZOOM_MIN) setPan({ x: 0, y: 0 })
    else setPan((p) => clampPan(p.x, p.y, next))
  }

  function zoomIn() {
    setZoom(Math.min(ZOOM_MAX, Math.round((zoom + ZOOM_STEP) * 100) / 100))
  }

  function rotate() {
    setRotation((r) => (r + 90) % 360)
    setPan({ x: 0, y: 0 })
  }

  /**
   * Magnifier-style explore: pointer position over the stage maps to which
   * region of the zoomed image is centered in the viewport.
   */
  function panFromPointer(clientX, clientY) {
    const stage = stageRef.current
    if (!stage || zoom <= ZOOM_MIN) return
    const rect = stage.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = (clientX - rect.left) / rect.width
    const ny = (clientY - rect.top) / rect.height
    const { maxX, maxY } = panLimits(stage)
    setPan({
      x: clamp((0.5 - nx) * 2 * maxX, -maxX, maxX),
      y: clamp((0.5 - ny) * 2 * maxY, -maxY, maxY),
    })
  }

  function onPointerDown(e) {
    if (!canPan) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
    setDragging(true)
  }

  function onPointerMove(e) {
    if (!canPan) return
    const drag = dragRef.current
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true
      setPan(clampPan(drag.originX + dx, drag.originY + dy))
      return
    }
    // Hover / finger move without a drag start: scroll-over explore
    if (e.pointerType === 'mouse') panFromPointer(e.clientX, e.clientY)
  }

  function onPointerUp(e) {
    if (dragRef.current?.id === e.pointerId) {
      dragRef.current = null
      setDragging(false)
    }
  }

  function onPointerLeave() {
    if (!dragRef.current && canPan) {
      // Keep last pan so the view does not jump when leaving
    }
  }

  const subtitle = canPan
    ? 'Move or drag over the image to explore · Tap a thumbnail to change'
    : 'Tap a thumbnail to change the main image'

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
