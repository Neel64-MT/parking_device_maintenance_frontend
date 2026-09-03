/**
 * Device summary card — .dev-card (raise / update / scan flows)
 * @param {{ id: string, location: string, facts?: { label: string, value: React.ReactNode }[] }} props
 */
export function DeviceCard({ id, location, facts = [] }) {
  return (
    <div className="dev-card">
      <div className="id">{id}</div>
      <div className="loc">{location}</div>
      {facts.length > 0 ? (
        <div className="row2">
          {facts.map((f) => (
            <div key={f.label}>
              <small>{f.label}</small>
              <span>{f.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
