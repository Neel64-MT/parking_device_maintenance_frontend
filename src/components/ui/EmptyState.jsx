/**
 * Empty state — .empty
 */
export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      {title ? <h4>{title}</h4> : null}
      {children ? <p>{children}</p> : null}
      {action || null}
    </div>
  )
}
