import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'

export function AppLayout() {
  const location = useLocation()
  const [railOpen, setRailOpen] = useState(false)

  const toggleRail = useCallback(() => {
    setRailOpen((v) => !v)
  }, [])

  const closeRail = useCallback(() => {
    setRailOpen(false)
  }, [])

  return (
    <>
      <Sidebar open={railOpen} onNavigate={closeRail} />
      <div className="shell">
        <Topbar onMenuClick={toggleRail} />
        <Outlet key={location.pathname} />
      </div>
    </>
  )
}
