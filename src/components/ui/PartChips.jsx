import { useState } from 'react'
import { PART_MASTER } from '../../data/partMaster'

/**
 * Toggleable part chips — .chip-row / .chip
 * @param {{ parts?: string[], selected?: string[], onChange?: (names: string[]) => void, defaultSelected?: string[] }} props
 */
export function PartChips({
  parts = PART_MASTER,
  selected: controlled,
  onChange,
  defaultSelected = [],
}) {
  const [internal, setInternal] = useState(() => new Set(defaultSelected))
  const selected = controlled ? new Set(controlled) : internal

  function toggle(name) {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    const list = [...next]
    if (!controlled) setInternal(next)
    onChange?.(list)
  }

  return (
    <div className="chip-row">
      {parts.map((p) => (
        <button
          key={p}
          type="button"
          className={`chip${selected.has(p) ? ' on' : ''}`}
          onClick={() => toggle(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
