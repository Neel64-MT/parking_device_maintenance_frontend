import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

const RAIL_BREAKPOINT = 820

export function AppLayout() {
  const location = useLocation()
  const [railOpen, setRailOpen] = useState(false)

  const toggleRail = useCallback(() => {
    setRailOpen((v) => !v)
  }, [])

  const closeRail = useCallback(() => {
    setRailOpen(false)
  }, [])

  /* Close the off-canvas rail when returning to desktop width. */
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > RAIL_BREAKPOINT) setRailOpen(false)
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
      <Sidebar open={railOpen} onNavigate={closeRail} />
      <div className="shell">
        <Topbar onMenuClick={toggleRail} railOpen={railOpen} />
        <Outlet key={location.pathname} />
      </div>
    </>
  )
}
