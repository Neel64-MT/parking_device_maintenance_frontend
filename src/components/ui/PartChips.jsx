import { useEffect, useId, useMemo, useRef, useState } from 'react'

function formatAmount(amount) {
  const n = Number(amount) || 0
  return `₹${n.toLocaleString('en-IN')}`
}

/**
 * Toggleable part selector. The default chip mode is kept for the close/demo
 * surfaces; `searchable` renders a searchable multi-select dropdown.
 * Selects by Parts `id`; label shows name + amount.
 *
 * @param {{
 *   items?: { id: string, name: string, amount?: number }[],
 *   selected?: string[],
 *   defaultSelected?: string[],
 *   onChange?: (ids: string[]) => void,
 *   loading?: boolean,
 *   error?: string,
 *   disabled?: boolean,
 *   searchable?: boolean,
 * }} props
 */
export function PartChips({
  items = [],
  selected: controlled,
  onChange,
  defaultSelected = [],
  loading = false,
  error = '',
  disabled = false,
  searchable = false,
}) {
  const [internal, setInternal] = useState(() => new Set(defaultSelected))
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const listboxId = useId()
  const itemList = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const selected = controlled ? new Set(controlled) : internal
  const selectedItems = itemList.filter((part) => selected.has(part.id))
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return itemList
    return itemList.filter((part) => {
      const searchableText = `${part.name || ''} ${part.amount ?? ''}`.toLocaleLowerCase()
      return searchableText.includes(needle)
    })
  }, [itemList, query])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function toggle(id) {
    if (disabled || loading) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const list = [...next]
    if (!controlled) setInternal(next)
    onChange?.(list)
  }

  function openSearch() {
    if (disabled) return
    setOpen(true)
    searchRef.current?.focus()
  }

  function closeSearch() {
    setOpen(false)
    setQuery('')
  }

  function onSearchKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSearch()
      searchRef.current?.blur()
      return
    }
    if (event.key === 'Enter' && filteredItems[0]) {
      event.preventDefault()
      toggle(filteredItems[0].id)
    }
  }

  if (searchable) {
    let menuContent
    if (loading) {
      menuContent = <p className="muted part-select-message">Loading parts…</p>
    } else if (error) {
      menuContent = (
        <p className="muted part-select-message" role="alert">
          {error}
        </p>
      )
    } else if (!itemList.length) {
      menuContent = <p className="muted part-select-message">No parts in master</p>
    } else if (!filteredItems.length) {
      menuContent = <p className="muted part-select-message">No parts match your search.</p>
    } else {
      menuContent = filteredItems.map((part) => {
        const isSelected = selected.has(part.id)
        return (
          <button
            key={part.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`part-select-option${isSelected ? ' is-selected' : ''}`}
            onClick={() => toggle(part.id)}
            disabled={disabled || loading}
          >
            <span className="part-select-option-name">{part.name}</span>
            {part.amount != null ? (
              <span className="part-select-option-amount">{formatAmount(part.amount)}</span>
            ) : null}
            <span className="part-select-option-check" aria-hidden="true">
              {isSelected ? '✓' : ''}
            </span>
          </button>
        )
      })
    }

    return (
      <div className={`part-select${open ? ' is-open' : ''}`} ref={rootRef}>
        <div className="part-select-dropdown">
          <div className="part-select-control">
            <input
              ref={searchRef}
              type="search"
              role="combobox"
              aria-label="Search parts"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listboxId}
              placeholder={selectedItems.length ? 'Search to add more parts' : 'Search parts…'}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={openSearch}
              onClick={openSearch}
              onKeyDown={onSearchKeyDown}
              disabled={disabled}
            />
            <button
              type="button"
              className="part-select-toggle"
              aria-label={open ? 'Close parts list' : 'Open parts list'}
              aria-expanded={open}
              onClick={open ? closeSearch : openSearch}
              disabled={disabled}
            >
              <span aria-hidden="true" />
            </button>
          </div>

          {open ? (
            <div
              id={listboxId}
              className="part-select-menu"
              role="listbox"
              aria-multiselectable="true"
            >
              {menuContent}
            </div>
          ) : null}
        </div>

        {selectedItems.length ? (
          <div className="part-selected-tags" aria-label="Selected parts">
            {selectedItems.map((part) => (
              <span className="part-selected-tag" key={part.id}>
                <span>
                  {part.name}
                  {part.amount != null ? ` · ${formatAmount(part.amount)}` : ''}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${part.name}`}
                  onClick={() => toggle(part.id)}
                  disabled={disabled || loading}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (loading) {
    return <p className="muted" style={{ margin: 0 }}>Loading parts…</p>
  }

  if (error) {
    return (
      <p className="muted" style={{ margin: 0 }} role="alert">
        {error}
      </p>
    )
  }

  if (!itemList.length) {
    return <p className="muted" style={{ margin: 0 }}>No parts in master</p>
  }

  return (
    <div className="chip-row">
      {itemList.map((part) => (
        <button
          key={part.id}
          type="button"
          className={`chip${selected.has(part.id) ? ' on' : ''}`}
          onClick={() => toggle(part.id)}
          disabled={disabled}
        >
          {part.name}
          {part.amount != null ? ` · ${formatAmount(part.amount)}` : ''}
        </button>
      ))}
    </div>
  )
}
