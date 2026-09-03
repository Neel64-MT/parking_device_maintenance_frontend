import { Link } from 'react-router-dom'

/**
 * Panel — .panel with optional head, body, foot-note.
 */
export function Panel({
  title,
  subtitle,
  link,
  linkTo,
  actions,
  flush = false,
  foot,
  className = '',
  children,
}) {
  const hasHead = title || subtitle || link || linkTo || actions

  return (
    <section className={`panel${className ? ` ${className}` : ''}`}>
      {hasHead ? (
        <div className="panel-head">
          {(title || subtitle) && (
            <div>
              {title ? <h3>{title}</h3> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          )}
          {linkTo ? (
            <Link className="link" to={linkTo}>
              {link}
            </Link>
          ) : link ? (
            <span className="link">{link}</span>
          ) : null}
          {actions ? <div className="actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
      {foot ? <div className="foot-note">{foot}</div> : null}
    </section>
  )
}
