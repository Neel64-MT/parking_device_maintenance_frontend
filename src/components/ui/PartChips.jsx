import { useState } from 'react'

function formatAmount(amount) {
  const n = Number(amount) || 0
  return `₹${n.toLocaleString('en-IN')}`
}

/**
 * Toggleable part chips — .chip-row / .chip
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
}) {
  const [internal, setInternal] = useState(() => new Set(defaultSelected))
  const selected = controlled ? new Set(controlled) : internal

  function toggle(id) {
    if (disabled || loading) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const list = [...next]
    if (!controlled) setInternal(next)
    onChange?.(list)
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

  if (!items.length) {
    return <p className="muted" style={{ margin: 0 }}>No parts in master</p>
  }

  return (
    <div className="chip-row">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`chip${selected.has(p.id) ? ' on' : ''}`}
          onClick={() => toggle(p.id)}
          disabled={disabled}
        >
          {p.name}
          {p.amount != null ? ` · ${formatAmount(p.amount)}` : ''}
        </button>
      ))}
    </div>
  )
}
