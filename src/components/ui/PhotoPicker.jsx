import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '../../context/ToastContext'
import { validateImageFile } from '../../services/uploads'
import { CameraCaptureModal } from './CameraCaptureModal'

function revokeUrl(url) {
  if (url) URL.revokeObjectURL(url)
}

/**
 * Multi-photo picker — folder or camera → local File + object-URL preview.
 * Uploads happen on parent form submit (see `uploadImages` in services/uploads).
 * Source menu + camera overlay portal to document.body so they work inside Modals
 * the same way they do on Raise Ticket (page form).
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
  const folderRef = useRef(null)
  const addBtnRef = useRef(null)
  const menuRef = useRef(null)
  const pickingFolderRef = useRef(false)
  const [items, setItems] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
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

  useLayoutEffect(() => {
    if (!menuOpen) return undefined

    function place() {
      const btn = addBtnRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      // Same as Raise: open upward above the Add photo tile.
      setMenuPos({
        left: Math.max(8, rect.left),
        bottom: Math.max(8, window.innerHeight - rect.top + 6),
        minWidth: Math.max(200, rect.width),
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onPointerDown(e) {
      // OS file dialog steals focus; don't tear down while a pick is in flight.
      if (pickingFolderRef.current) return
      const t = e.target
      if (addBtnRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      if (folderRef.current?.contains(t)) return
      setMenuOpen(false)
      setMenuPos(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
    setMenuPos(null)
  }

  function openFolderPicker() {
    if (itemsRef.current.length >= max) {
      toast(`You can attach up to ${max} photos.`, 'warning')
      closeMenu()
      return
    }
    pickingFolderRef.current = true
    closeMenu()
    // Defer so the portaled menu unmounts before the native dialog opens.
    requestAnimationFrame(() => {
      folderRef.current?.click()
      // If the user cancels, some browsers never fire change/cancel — clear the lock on focus.
      const clearPickLock = () => {
        window.setTimeout(() => {
          pickingFolderRef.current = false
        }, 300)
        window.removeEventListener('focus', clearPickLock)
      }
      window.addEventListener('focus', clearPickLock)
    })
  }

  function openCamera() {
    if (itemsRef.current.length >= max) {
      toast(`You can attach up to ${max} photos.`, 'warning')
      closeMenu()
      return
    }
    closeMenu()
    if (!navigator.mediaDevices?.getUserMedia) {
      toast('Camera is not available on this device. Choose from folder instead.', 'warning')
      return
    }
    setCameraOpen(true)
  }

  function onFolderInputChange(e) {
    // Copy first — clearing the input empties the live FileList.
    const files = Array.from(e.target.files || [])
    if (folderRef.current) folderRef.current.value = ''
    pickingFolderRef.current = false
    handleFiles(files)
  }

  function onFolderInputCancel() {
    pickingFolderRef.current = false
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const remaining = max - itemsRef.current.length
    if (remaining <= 0) {
      toast(`You can attach up to ${max} photos.`, 'warning')
      return
    }

    if (files.length > remaining) {
      toast(`You can attach up to ${max} photos. Extra files were skipped.`, 'warning')
    }

    const toProcess = files.slice(0, remaining)
    setBusy(true)
    const added = []
    try {
      for (const file of toProcess) {
        const invalid = validateImageFile(file)
        if (invalid) {
          toast(invalid, 'error')
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
    }
  }

  function removeAt(index) {
    setItems((prev) => {
      const target = prev[index]
      if (target?.url) revokeUrl(target.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const count = items.length
  const atLimit = count >= max
  const addDisabled = disabled || busy

  const sourceMenu =
    menuOpen && !addDisabled && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="photo-source-menu photo-source-menu--portal"
            role="menu"
            style={{
              left: menuPos.left,
              bottom: menuPos.bottom,
              minWidth: menuPos.minWidth,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                openFolderPicker()
              }}
            >
              <svg
                className="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4.2l1.6 1.8H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V7.5z" />
              </svg>
              Choose from folder
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                openCamera()
              }}
            >
              <svg
                className="ico"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
              Capture from camera
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="photos">
      {/* Always mounted — survives menu close so folder picks are not lost. */}
      <input
        ref={folderRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        className="photo-folder-input-hidden"
        onChange={onFolderInputChange}
        onCancel={onFolderInputCancel}
      />

      {items.map((item, index) => (
        <div key={item.id} className="photo-thumb has-img">
          <img src={item.url} alt={item.name || `Photo ${index + 1}`} />
          <button
            type="button"
            className="x"
            aria-label={`Remove photo ${index + 1}`}
            disabled={addDisabled}
            onClick={(e) => {
              e.stopPropagation()
              removeAt(index)
            }}
          >
            &times;
          </button>
        </div>
      ))}

      {!atLimit ? (
        <div className="photo-add-wrap">
          <button
            ref={addBtnRef}
            type="button"
            className="photo-add"
            disabled={addDisabled}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((o) => !o)
            }}
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
          {sourceMenu}
        </div>
      ) : null}

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
