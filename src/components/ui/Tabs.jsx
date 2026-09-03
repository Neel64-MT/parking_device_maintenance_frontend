/**
 * Tab strip — .tabs
 * @param {{ tabs: { id: string, label: string, count?: number|string }[], value: string, onChange: (id: string) => void }} props
 */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === value ? 'on' : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count != null ? <span className="cnt">{t.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
