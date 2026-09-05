/**
 * Tab strip — .tabs
 * Optional `actions` render on the right (e.g. search + Raise ticket).
 * @param {{ tabs: { id: string, label: string, count?: number|string }[], value: string, onChange: (id: string) => void, actions?: import('react').ReactNode }} props
 */
export function Tabs({ tabs, value, onChange, actions = null }) {
  return (
    <div className={`tabs${actions ? ' tabs-row' : ''}`}>
      <div className="tabs-list" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === value}
            className={t.id === value ? 'on' : undefined}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {t.count != null ? <span className="cnt">{t.count}</span> : null}
          </button>
        ))}
      </div>
      {actions ? <div className="tabs-actions">{actions}</div> : null}
    </div>
  )
}
