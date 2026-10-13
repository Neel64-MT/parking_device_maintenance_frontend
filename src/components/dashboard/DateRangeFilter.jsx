import { DATE_PRESETS, detectPreset, presetRange } from '../../utils/dateRange'

/**
 * Period preset + From / To date inputs. Controlled: the parent owns `from` / `to`; the preset
 * shown is derived from them (a manual edit that matches no preset shows "Custom range").
 */
export function DateRangeFilter({ from, to, today, onChange, label = 'Report' }) {
  const preset = detectPreset(from, to, today)

  function choosePreset(value) {
    const range = presetRange(value, today)
    if (range) onChange(range)
  }

  return (
    <>
      <select aria-label={`${label} period`} value={preset} onChange={(e) => choosePreset(e.target.value)}>
        {DATE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        aria-label={`${label} from date`}
        value={from}
        max={today}
        onChange={(e) => onChange({ from: e.target.value, to })}
      />
      <input
        type="date"
        aria-label={`${label} to date`}
        value={to}
        max={today}
        onChange={(e) => onChange({ from, to: e.target.value })}
      />
    </>
  )
}
