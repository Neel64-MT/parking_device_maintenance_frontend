import { useState } from 'react'
import { Modal } from './Modal'

/**
 * Shopping-style image gallery: one large image + selectable thumbnails.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   images?: string[],
 *   title?: string,
 * }} props
 */
export function ImagePreviewModal({ open, onClose, images = [], title = 'Images' }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const list = Array.isArray(images) ? images.filter(Boolean) : []

  if (!open || !list.length) return null

  const safeIndex = Math.min(Math.max(activeIndex, 0), list.length - 1)
  const main = list[safeIndex]

  return (
    <Modal open={open} title={title} subtitle="Tap a thumbnail to change the main image" onClose={onClose} wide>
      <div className="img-preview">
        <div className="img-preview-main">
          <img src={main} alt={`Image ${safeIndex + 1} of ${list.length}`} />
        </div>
        {list.length > 1 ? (
          <div className="img-preview-thumbs" role="list">
            {list.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                role="listitem"
                className={`img-preview-thumb${i === safeIndex ? ' is-active' : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === safeIndex ? 'true' : undefined}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
