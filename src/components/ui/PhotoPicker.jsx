import { useState } from 'react'

/**
 * Multi-photo picker — placeholder thumbs (design preview).
 * Ported from asset/app.js photoPicker.
 */
export function PhotoPicker({
  start = 0,
  hint = 'You can attach as many photos as you need.',
}) {
  const [count, setCount] = useState(start)

  function add() {
    setCount((n) => n + 1)
  }

  function remove() {
    setCount((n) => Math.max(0, n - 1))
  }

  const thumbs = []
  for (let i = 1; i <= count; i++) {
    thumbs.push(
      <div key={i} className="photo-thumb">
        Photo {i}
        <button type="button" className="x" aria-label="Remove photo" onClick={remove}>
          &times;
        </button>
      </div>,
    )
  }

  return (
    <div className="photos">
      {thumbs}
      <button type="button" className="photo-add" onClick={add}>
        <svg
          className="ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
        {count ? 'Add more' : 'Add photo'}
      </button>
      <div className="photo-count" style={{ width: '100%' }}>
        {count
          ? `${count} photo${count > 1 ? 's' : ''} attached`
          : hint}
      </div>
    </div>
  )
}
