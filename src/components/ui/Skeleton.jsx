/**
 * Shared loading skeletons — pulse bars using app tokens (no new libraries).
 */

function styleFromProps({ width, height, radius }) {
  const style = {}
  if (width != null) style.width = typeof width === 'number' ? `${width}px` : width
  if (height != null) style.height = typeof height === 'number' ? `${height}px` : height
  if (radius != null) style.borderRadius = typeof radius === 'number' ? `${radius}px` : radius
  return style
}

/** Single shimmer block. */
export function Skeleton({ width, height = 12, radius = 6, className = '', style: styleProp }) {
  return (
    <span
      className={`sk${className ? ` ${className}` : ''}`}
      style={{ ...styleFromProps({ width, height, radius }), ...styleProp }}
      aria-hidden="true"
    />
  )
}

/** Stacked text lines. */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`sk-text${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={10}
          width={i === lines - 1 && lines > 1 ? '62%' : '100%'}
          className="sk-text-line"
        />
      ))}
    </div>
  )
}

/**
 * Table body of skeleton rows (use inside existing table + thead).
 * @param {{ rows?: number, cols: number }} props
 */
export function SkeletonTable({ rows = 6, cols }) {
  const n = Math.max(1, cols || 1)
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="sk-table-row">
          {Array.from({ length: n }, (_, c) => (
            <td key={c}>
              <Skeleton height={11} width={c === 0 ? '72%' : c === n - 1 ? '40%' : '88%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Tile-shaped blocks using existing `.tiles` / `.tiles.five` grid.
 * @param {{ count?: number, five?: boolean, className?: string }} props
 */
export function SkeletonTiles({ count = 4, five = false, className = '' }) {
  const cls = `tiles${five ? ' five' : ''}${className ? ` ${className}` : ''}`
  return (
    <div className={cls} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="tile sk-tile">
          <Skeleton height={22} width="42%" className="sk-tile-n" />
          <Skeleton height={10} width="70%" />
        </div>
      ))}
    </div>
  )
}

/** Minimal auth session boot (not a fake dashboard). */
export function AuthBootSkeleton() {
  return (
    <div className="auth-boot" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="auth-boot-sk">
        <Skeleton height={36} width={160} radius={8} />
        <Skeleton height={10} width={220} />
        <Skeleton height={10} width={180} />
      </div>
    </div>
  )
}

/** Ticket list loading region. */
export function TicketListSkeleton({ cols = 11 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tickets</span>
      <SkeletonTiles count={4} />
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i}>
                  <Skeleton height={10} width="70%" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTable rows={6} cols={cols} />
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Ticket detail page skeleton. */
export function TicketDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading ticket</span>
      <section className="record sk-record">
        <div className="record-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton height={22} width={120} />
            <Skeleton height={12} width="55%" style={{ marginTop: 10 }} />
          </div>
          <Skeleton height={28} width={88} radius={999} />
          <div className="push" style={{ display: 'flex', gap: 8 }}>
            <Skeleton height={32} width={96} radius={8} />
            <Skeleton height={32} width={110} radius={8} />
          </div>
        </div>
        <div className="facts">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i}>
              <Skeleton height={9} width="40%" />
              <Skeleton height={14} width="70%" style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      </section>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="panel sk-panel">
          <div className="panel-head">
            <Skeleton height={14} width="45%" />
          </div>
          <div className="panel-body">
            <SkeletonText lines={4} />
          </div>
        </div>
        <div className="panel sk-panel">
          <div className="panel-head">
            <Skeleton height={14} width="50%" />
          </div>
          <div className="panel-body">
            <SkeletonText lines={4} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Device history page skeleton. */
export function DeviceDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading device history</span>
      <section className="record sk-record">
        <div className="record-top">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton height={22} width={120} />
            <Skeleton height={12} width="55%" style={{ marginTop: 10 }} />
          </div>
          <Skeleton height={28} width={88} radius={999} />
          <div className="push" style={{ display: 'flex', gap: 8 }}>
            <Skeleton height={32} width={96} radius={8} />
            <Skeleton height={32} width={90} radius={8} />
          </div>
        </div>
        <div className="facts">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <Skeleton height={9} width="40%" />
              <Skeleton height={14} width="70%" style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      </section>
      <SkeletonTiles count={5} five className="sk-tiles" />
      <div className="panel sk-panel" style={{ marginTop: 16 }}>
        <div className="panel-head">
          <Skeleton height={14} width="40%" />
        </div>
        <div className="panel-body flush">
          <SkeletonTable rows={5} cols={8} />
        </div>
      </div>
    </div>
  )
}

/** Dashboard data region skeleton (filters stay outside). */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <section className="fleet sk-fleet">
        <div className="fleet-head">
          <Skeleton height={36} width={72} />
          <Skeleton height={12} width={160} />
          <Skeleton height={10} width={100} />
        </div>
        <Skeleton height={14} width="100%" radius={8} style={{ marginTop: 14 }} />
        <div className="legend" style={{ marginTop: 16 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton height={18} width={36} />
              <Skeleton height={10} width={64} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      </section>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="panel sk-panel">
          <div className="panel-head">
            <Skeleton height={14} width="55%" />
          </div>
          <div className="panel-body">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="sk-rank-row">
                <Skeleton height={12} width="38%" />
                <Skeleton height={8} width="100%" radius={4} />
                <Skeleton height={12} width={28} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel sk-panel">
          <div className="panel-head">
            <Skeleton height={14} width="48%" />
          </div>
          <div className="panel-body">
            <SkeletonText lines={5} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Users list loading region. */
export function UsersSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading users</span>
      <SkeletonTiles count={4} />
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              {Array.from({ length: 8 }, (_, i) => (
                <th key={i}>
                  <Skeleton height={10} width="65%" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonTable rows={6} cols={8} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
