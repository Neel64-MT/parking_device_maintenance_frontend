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
export function Field({
  label,
  required,
  hint,
  hintAfter,
  error,
  errorId,
  children,
  className = '',
  style,
}) {
  return (
    <div
      className={`fld${error ? ' has-error' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {label ? (
        <span>
          {label}
          {required ? <i className="req"> *</i> : null}
        </span>
      ) : null}
      {hint && !error ? <i className="hint">{hint}</i> : null}
      {children}
      {error ? (
        <i className="field-error" id={errorId} role="alert">
          {error}
        </i>
      ) : null}
      {hintAfter ? <i className="hint">{hintAfter}</i> : null}
    </div>
  )
}
