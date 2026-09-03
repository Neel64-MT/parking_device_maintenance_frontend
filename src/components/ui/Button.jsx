/**
 * Button — maps to .btn / .btn-primary / .btn-dark / .btn-danger / .btn-sm
 */
export function Button({
  variant = 'default',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn']
  if (variant === 'primary') classes.push('btn-primary')
  if (variant === 'dark') classes.push('btn-dark')
  if (variant === 'danger') classes.push('btn-danger')
  if (size === 'sm') classes.push('btn-sm')
  if (className) classes.push(className)

  return (
    <button type={type} className={classes.join(' ')} {...rest}>
      {children}
    </button>
  )
}
