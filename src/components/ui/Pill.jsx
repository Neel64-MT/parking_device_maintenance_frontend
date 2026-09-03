import { severityPillClass } from '../../data/issueMaster'

/**
 * Status / severity pill — .pill + .p-ok | .p-warn | .p-bad | .p-info | .p-grey
 */
export function Pill({ tone = 'grey', children, className = '' }) {
  const toneClass =
    tone === 'ok'
      ? 'p-ok'
      : tone === 'warn'
        ? 'p-warn'
        : tone === 'bad'
          ? 'p-bad'
          : tone === 'info'
            ? 'p-info'
            : 'p-grey'

  return <span className={`pill ${toneClass}${className ? ` ${className}` : ''}`}>{children}</span>
}

/** Convenience for Critical / Major / Minor */
export function SeverityPill({ severity }) {
  return <span className={`pill ${severityPillClass(severity)}`}>{severity}</span>
}
