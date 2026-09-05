/**
 * Hover / focus tooltip. Wraps a single child (e.g. a link).
 */
export function Tooltip({ content, children, className = '' }) {
  if (!content) return children

  return (
    <span className={`tooltip${className ? ` ${className}` : ''}`}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  )
}
