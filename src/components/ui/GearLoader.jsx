/**
 * Themed gear animation for empty/error surfaces (e.g. 404).
 * Plain CSS — no styled-components; no black panel background.
 */
export function GearLoader({ className = '' }) {
  return (
    <div className={`gearbox${className ? ` ${className}` : ''}`} aria-hidden="true">
      <div className="gear one">
        <div className="gear-inner">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
      </div>
      <div className="gear two">
        <div className="gear-inner">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
      </div>
      <div className="gear three">
        <div className="gear-inner">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
      </div>
      <div className="gear four large">
        <div className="gear-inner">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
      </div>
    </div>
  )
}
