import { useEffect, useId, useRef, useState } from 'react'
import { toast } from '../../context/ToastContext'
import { validateImageFile } from '../../services/uploads'
import { CameraCaptureModal } from './CameraCaptureModal'

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url)
}

/**
 * Multi-photo picker — folder or camera → local File + object-URL preview.
 * Uploads happen on parent form submit (see `uploadImages` in services/uploads).
 * @param {{
 *   hint?: string,
 *   max?: number,
 *   onChange?: (files: File[]) => void,
 *   disabled?: boolean,
 * }} props
 */
export function PhotoPicker({
  hint = 'You can attach up to 5 photos.',
  max = 5,
  onChange,
  disabled = false,
}) {
  const folderId = useId()
  const folderRef = useRef(null)
  const [items, setItems] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const onChangeRef = useRef(onChange)
  const itemsRef = useRef(items)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    onChangeRef.current?.(items.map((i) => i.file))
  }, [items])

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => revokeUrl(item.url))
    }
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  function openFolder() {
    closeMenu()
    if (itemsRef.current.length >= max) {
      toast(`You can attach up to ${max} photos.`)
      return
    }
    folderRef.current?.click()
  }

  function openCamera() {
    closeMenu()
    if (itemsRef.current.length >= max) {
      toast(`You can attach up to ${max} photos.`)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Camera is not available on this device. Choose from folder instead.')
      return
    }
    setCameraOpen(true)
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) {
      toast('No image captured. Try again or choose from folder.')
      return
    }

    const remaining = max - itemsRef.current.length
    if (remaining <= 0) {
      toast(`You can attach up to ${max} photos.`)
      if (folderRef.current) folderRef.current.value = ''
      return
    }

    if (files.length > remaining) {
      toast(`You can attach up to ${max} photos. Extra files were skipped.`)
    }

    const toProcess = files.slice(0, remaining)
    setBusy(true)
    const added = []
    try {
      for (const file of toProcess) {
        const invalid = validateImageFile(file)
        if (invalid) {
          toast(invalid)
          continue
        }
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
        })
      }
      if (added.length) {
        // Decide keep/discard before setState so the updater stays pure
        // (React Strict Mode may double-invoke updaters).
        const room = Math.max(0, max - itemsRef.current.length)
        const keep = added.slice(0, room)
        added.slice(room).forEach((item) => revokeUrl(item.url))
        if (keep.length) {
          setItems((prev) => {
            const actualRoom = max - prev.length
            if (actualRoom <= 0) {
              keep.forEach((item) => revokeUrl(item.url))
              return prev
            }
            if (keep.length > actualRoom) {
              keep.slice(actualRoom).forEach((item) => revokeUrl(item.url))
            }
            return [...prev, ...keep.slice(0, actualRoom)]
          })
        }
      }
    } finally {
      setBusy(false)
      if (folderRef.current) folderRef.current.value = ''
    }
  }

  function removeAt(index) {
    setItems((prev) => {
      const target = prev[index]
      // Revoke only the removed item; do not touch remaining preview URLs.
      if (target?.url) revokeUrl(target.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const count = items.length
  const atLimit = count >= max
  const addDisabled = disabled || busy

  return (
    // preventDefault: if a parent still wraps this in <label>, clicks on thumbs /
    // count must not activate the first control (the first photo's remove button).
    <div className="photos" onClick={(e) => e.preventDefault()}>
      {items.map((item, index) => (
        <div key={item.id} className="photo-thumb has-img">
          <img src={item.url} alt={item.name || `Photo ${index + 1}`} />
          <button
            type="button"
            className="x"
            aria-label={`Remove photo ${index + 1}`}
            disabled={addDisabled}
            onClick={() => removeAt(index)}
          >
            &times;
          </button>
        </div>
      ))}

      {!atLimit ? (
        <div className="photo-add-wrap">
          <button
            type="button"
            className="photo-add"
            disabled={addDisabled}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
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
            {busy ? 'Adding…' : count ? 'Add more' : 'Add photo'}
          </button>

          {menuOpen && !addDisabled ? (
            <div className="photo-source-menu" role="menu">
              <button type="button" role="menuitem" onClick={openFolder}>
                Choose from folder
              </button>
              <button type="button" role="menuitem" onClick={openCamera}>
                Capture from camera
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <input
        id={folderId}
        ref={folderRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {cameraOpen ? (
        <CameraCaptureModal
          open
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => handleFiles([file])}
        />
      ) : null}

      <div className="photo-count" style={{ width: '100%' }}>
        {count
          ? `${count} of ${max} photo${count > 1 ? 's' : ''} attached`
          : hint}
      </div>
    </div>
  )
}
