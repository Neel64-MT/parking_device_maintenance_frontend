import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

const RAIL_BREAKPOINT = 820
/** Match mobile drawer + desktop collapse duration in index.css */
const RAIL_CLOSE_MS = 380

function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth > RAIL_BREAKPOINT
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function AppLayout() {
  const location = useLocation()
  const [railOpen, setRailOpen] = useState(false)
  const [railClosing, setRailClosing] = useState(false)
  const [railOpening, setRailOpening] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [desktop, setDesktop] = useState(() => isDesktop())
  const closeTimerRef = useRef(null)
  const openTimerRef = useRef(null)
  const openRafRef = useRef(null)
  const collapseTimerRef = useRef(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const clearOpenTimers = useCallback(() => {
    if (openTimerRef.current != null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (openRafRef.current != null) {
      cancelAnimationFrame(openRafRef.current)
      openRafRef.current = null
    }
  }, [])

  const finishRailClose = useCallback(() => {
    clearCloseTimer()
    clearOpenTimers()
    setRailOpen(false)
    setRailClosing(false)
    setRailOpening(false)
  }, [clearCloseTimer, clearOpenTimers])

  const closeRail = useCallback(() => {
    if (railClosing) return
    if (!railOpen && !railOpening) return
    clearOpenTimers()
    setRailOpening(false)
    if (prefersReducedMotion()) {
      finishRailClose()
      return
    }
    setRailOpen(false)
    setRailClosing(true)
    clearCloseTimer()
    closeTimerRef.current = setTimeout(finishRailClose, RAIL_CLOSE_MS)
  }, [railOpen, railOpening, railClosing, finishRailClose, clearCloseTimer, clearOpenTimers])

  const openRail = useCallback(() => {
    clearCloseTimer()
    clearOpenTimers()
    setRailClosing(false)
    if (prefersReducedMotion()) {
      setRailOpening(false)
      setRailOpen(true)
      return
    }
    /* Arm transitions off-canvas, then add .show on the next frames so slide-in runs. */
    setRailOpening(true)
    setRailOpen(false)
    openRafRef.current = requestAnimationFrame(() => {
      openRafRef.current = requestAnimationFrame(() => {
        openRafRef.current = null
        setRailOpen(true)
      })
    })
    openTimerRef.current = setTimeout(() => {
      setRailOpening(false)
      openTimerRef.current = null
    }, RAIL_CLOSE_MS)
  }, [clearCloseTimer, clearOpenTimers])

  const toggleRail = useCallback(() => {
    if (railOpen || railClosing || railOpening) closeRail()
    else openRail()
  }, [railOpen, railClosing, railOpening, closeRail, openRail])

  const toggleCollapse = useCallback(() => {
    if (collapseTimerRef.current != null) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
    document.documentElement.classList.remove('rail-closing')
    document.documentElement.classList.remove('rail-opening')

    setRailCollapsed((wasCollapsed) => {
      const collapsing = !wasCollapsed

      if (!collapsing) {
        /* Expand: arm transitions while still narrow, then drop narrow + collapsed. */
        if (!prefersReducedMotion()) {
          document.documentElement.classList.add('rail-opening')
          void document.documentElement.offsetWidth
          collapseTimerRef.current = setTimeout(() => {
            document.documentElement.classList.remove('rail-opening')
            collapseTimerRef.current = null
          }, RAIL_CLOSE_MS)
        }
        document.documentElement.classList.remove('rail-narrow')
        return false
      }

      /* Collapse: arm transitions, then sync --rail + .collapsed in one turn. */
      if (!prefersReducedMotion()) {
        document.documentElement.classList.add('rail-closing')
        void document.documentElement.offsetWidth
        collapseTimerRef.current = setTimeout(() => {
          document.documentElement.classList.remove('rail-closing')
          collapseTimerRef.current = null
        }, RAIL_CLOSE_MS)
      }
      if (isDesktop()) {
        document.documentElement.classList.add('rail-narrow')
      }
      return true
    })
  }, [])

  /* Keep html.rail-narrow aligned on resize / desktop flips. */
  useEffect(() => {
    document.documentElement.classList.toggle('rail-narrow', railCollapsed && desktop)
  }, [railCollapsed, desktop])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('rail-narrow')
      document.documentElement.classList.remove('rail-closing')
      document.documentElement.classList.remove('rail-opening')
      if (collapseTimerRef.current != null) clearTimeout(collapseTimerRef.current)
      if (closeTimerRef.current != null) clearTimeout(closeTimerRef.current)
      if (openTimerRef.current != null) clearTimeout(openTimerRef.current)
      if (openRafRef.current != null) cancelAnimationFrame(openRafRef.current)
    }
  }, [])

  useEffect(() => {
    function onResize() {
      const next = isDesktop()
      setDesktop(next)
      if (next) finishRailClose()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [finishRailClose])

  /* Escape closes the drawer on phone (menu button still toggles). */
  useEffect(() => {
    if (!railOpen && !railClosing && !railOpening) return undefined
    function onKey(e) {
      if (e.key === 'Escape') closeRail()
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('rail-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('rail-lock')
    }
  }, [railOpen, railClosing, railOpening, closeRail])

  const collapsed = railCollapsed && desktop
  const drawerActive = railOpen || railClosing || railOpening
  /* Open = expanded rail (desktop) or drawer shown (mobile). Closed → hamburger, open → X. */
  const menuOpen = desktop ? !railCollapsed : drawerActive
  const onMenuClick = desktop ? toggleCollapse : toggleRail

  return (
    <>
      {drawerActive ? (
        <button
          type="button"
          className={`rail-scrim${railOpening && !railClosing ? ' is-opening' : ''}${railClosing ? ' is-closing' : ''}`}
          aria-label="Close menu"
          onClick={closeRail}
        />
      ) : null}
      <Sidebar
        open={railOpen}
        opening={railOpening}
        closing={railClosing}
        onNavigate={closeRail}
        collapsed={collapsed}
        onCloseTransitionEnd={finishRailClose}
      />
      <div className="shell">
        <Topbar onMenuClick={onMenuClick} menuOpen={menuOpen} />
        <Outlet key={location.pathname} />
      </div>
    </>
  )
}
