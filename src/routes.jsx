import { Route, Routes } from 'react-router-dom'
import { GuestOnly, HomeRedirect, RequireAuth } from './context/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import DeviceList from './pages/devices/DeviceList'
import DeviceDetail from './pages/devices/DeviceDetail'
import DeviceAdd from './pages/devices/DeviceAdd'
import ScanQr from './pages/devices/ScanQr'
import IssueMaster from './pages/masters/IssueMaster'
import RoadList from './pages/masters/RoadList'
import RoadAdd from './pages/masters/RoadAdd'
import TicketList from './pages/tickets/TicketList'
import TicketRaise from './pages/tickets/TicketRaise'
import TicketUpdate from './pages/tickets/TicketUpdate'
import TicketClose from './pages/tickets/TicketClose'
import TicketDetail from './pages/tickets/TicketDetail'
import WorkReport from './pages/tickets/WorkReport'
import { UiKitDemoPage } from './pages/UiKitDemo'

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        }
      >
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dev/ui" element={<UiKitDemoPage />} />

        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/raise" element={<TicketRaise />} />
        <Route path="tickets/update" element={<TicketUpdate />} />
        <Route path="tickets/close" element={<TicketClose />} />
        <Route path="tickets/report" element={<WorkReport />} />
        <Route path="tickets/:ticketId" element={<TicketDetail />} />

        <Route path="devices" element={<DeviceList />} />
        <Route path="devices/add" element={<DeviceAdd />} />
        <Route path="devices/scan" element={<ScanQr />} />
        <Route path="devices/:deviceId" element={<DeviceDetail />} />

        <Route path="masters/issues" element={<IssueMaster />} />
        <Route path="masters/roads" element={<RoadList />} />
        <Route path="masters/roads/add" element={<RoadAdd />} />

        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />

        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  )
}
