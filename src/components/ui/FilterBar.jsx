/**
 * Filter bar container — .filterbar
 * Children are typically label.fld fields; put action buttons in push slot.
 */
export function FilterBar({ children, actions }) {
  return (
    <div className="filterbar">
      {children}
      {actions ? <div className="push">{actions}</div> : null}
    </div>
  )
}

/** Field label wrapper — label.fld */
export function Field({ label, required, hint, children, className = '', style }) {
  return (
    <label className={`fld${className ? ` ${className}` : ''}`} style={style}>
      {label ? (
        <span>
          {label}
          {required ? <i className="req"> *</i> : null}
        </span>
      ) : null}
      {children}
      {hint ? <i className="hint">{hint}</i> : null}
    </label>
  )
}
