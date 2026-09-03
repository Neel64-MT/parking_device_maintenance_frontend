/**
 * Day / Week / Month / Range switcher — .views
 * @param {{ views: { id: string, label: string }[], value: string, onChange: (id: string) => void }} props
 */
export function Views({ views, value, onChange }) {
  return (
    <div className="views">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          className={v.id === value ? 'on' : undefined}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
