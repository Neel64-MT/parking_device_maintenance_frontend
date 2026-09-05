import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

const RAIL_BREAKPOINT = 820

function isDesktop() {
  return typeof window !== 'undefined' && window.innerWidth > RAIL_BREAKPOINT
}

export function AppLayout() {
  const location = useLocation()
  const [railOpen, setRailOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [desktop, setDesktop] = useState(() => isDesktop())

  const toggleRail = useCallback(() => {
    setRailOpen((v) => !v)
  }, [])

  const closeRail = useCallback(() => {
    setRailOpen(false)
  }, [])

  const toggleCollapse = useCallback(() => {
    setRailCollapsed((v) => !v)
  }, [])

  /* Sync html.rail-narrow with desktop collapse only. */
  useEffect(() => {
    document.documentElement.classList.toggle('rail-narrow', railCollapsed && desktop)
  }, [railCollapsed, desktop])

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('rail-narrow')
    }
  }, [])

  useEffect(() => {
    function onResize() {
      const next = isDesktop()
      setDesktop(next)
      if (next) setRailOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* Escape closes the drawer on phone (menu button still toggles). */
  useEffect(() => {
    if (!railOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setRailOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('rail-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('rail-lock')
    }
  }, [railOpen])

  const collapsed = railCollapsed && desktop
  /* Open = expanded rail (desktop) or drawer shown (mobile). Closed → hamburger, open → X. */
  const menuOpen = desktop ? !railCollapsed : railOpen
  const onMenuClick = desktop ? toggleCollapse : toggleRail

  return (
    <>
      {railOpen ? (
        <button
          type="button"
          className="rail-scrim"
          aria-label="Close menu"
          onClick={closeRail}
        />
      ) : null}
      <Sidebar open={railOpen} onNavigate={closeRail} collapsed={collapsed} />
      <div className="shell">
        <Topbar onMenuClick={onMenuClick} menuOpen={menuOpen} />
        <Outlet key={location.pathname} />
      </div>
    </>
  )
}
