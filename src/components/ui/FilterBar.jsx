/**
 * Filter bar container — .filterbar
 * Children are typically .fld fields; put action buttons in push slot.
 */
export function FilterBar({ children, actions }) {
  return (
    <div className="filterbar">
      {children}
      {actions ? <div className="push">{actions}</div> : null}
    </div>
  )
}

/**
 * Field wrapper — .fld
 * Uses a div (not <label>) so composite controls (PhotoPicker, chips, selects)
 * are not hijacked by label activation of the first nested button/input.
 */
export function Field({ label, required, hint, children, className = '', style }) {
  return (
    <div className={`fld${className ? ` ${className}` : ''}`} style={style}>
      {label ? (
        <span>
          {label}
          {required ? <i className="req"> *</i> : null}
        </span>
      ) : null}
      {children}
      {hint ? <i className="hint">{hint}</i> : null}
    </div>
  )
}
