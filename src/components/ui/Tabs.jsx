import { useLayoutEffect, useRef } from 'react'

/**
 * Tab strip — .tabs
 * Optional `actions` render on the right (e.g. search).
 * The active underline (.tabs-ink) slides between tabs; it is positioned via the DOM so
 * count changes and resizes never trigger extra renders.
 * @param {{ tabs: { id: string, label: string, count?: number|string }[], value: string, onChange: (id: string) => void, actions?: import('react').ReactNode }} props
 */
export function Tabs({ tabs, value, onChange, actions = null }) {
  const listRef = useRef(null)
  const inkRef = useRef(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const ink = inkRef.current
    if (!list || !ink) return undefined

    function place() {
      const active = list.querySelector('[role="tab"][aria-selected="true"]')
      if (!active) {
        ink.style.opacity = '0'
        return
      }
      ink.style.opacity = '1'
      ink.style.width = `${active.offsetWidth}px`
      ink.style.transform = `translateX(${active.offsetLeft}px)`
    }

    place()
    const frame = requestAnimationFrame(() => {
      ink.dataset.ready = 'true'
    })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    if (observer) {
      observer.observe(list)
      list.querySelectorAll('[role="tab"]').forEach((btn) => observer.observe(btn))
    }
    window.addEventListener('resize', place)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [value, tabs])

  return (
    <div className={`tabs${actions ? ' tabs-row' : ''}`}>
      <div className="tabs-list" role="tablist" ref={listRef}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === value}
            className={t.id === value ? 'on' : undefined}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {t.count != null ? <span className="cnt">{t.count}</span> : null}
          </button>
        ))}
        <span className="tabs-ink" ref={inkRef} aria-hidden="true" />
      </div>
      {actions ? <div className="tabs-actions">{actions}</div> : null}
    </div>
  )
}
