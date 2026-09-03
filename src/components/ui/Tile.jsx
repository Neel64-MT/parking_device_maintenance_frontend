/**
 * Summary tile — .tile / .tile.ok|warn|bad
 */
export function Tile({ value, label, tone, className = '' }) {
  const toneClass = tone === 'ok' || tone === 'warn' || tone === 'bad' ? ` ${tone}` : ''
  return (
    <div className={`tile${toneClass}${className ? ` ${className}` : ''}`}>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  )
}
