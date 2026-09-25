import { Route, Routes } from 'react-router-dom'
import { GuestOnly, HomeRedirect, RequireAuth, RequirePerm } from './context/AuthContext'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import DeviceList from './pages/devices/DeviceList'
import DeviceDetail from './pages/devices/DeviceDetail'
import DeviceAdd from './pages/devices/DeviceAdd'
import IssueMaster from './pages/masters/IssueMaster'
import RoadList from './pages/masters/RoadList'
import RoadAdd from './pages/masters/RoadAdd'
import PartMaster from './pages/masters/PartMaster'
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
        <Route
          path="dashboard"
          element={
            <RequirePerm screen="Dashboard">
              <Dashboard />
            </RequirePerm>
          }
        />
        <Route path="dev/ui" element={<UiKitDemoPage />} />

        <Route
          path="tickets"
          element={
            <RequirePerm screen="All tickets">
              <TicketList />
            </RequirePerm>
          }
        />
        <Route
          path="tickets/raise"
          element={
            <RequirePerm screen="Raise ticket">
              <TicketRaise />
            </RequirePerm>
          }
        />
        <Route
          path="tickets/update"
          element={
            <RequirePerm screen="Update ticket">
              <TicketUpdate />
            </RequirePerm>
          }
        />
        <Route
          path="tickets/close"
          element={
            <RequirePerm screen="Update ticket" flag="x">
              <TicketClose />
            </RequirePerm>
          }
        />
        <Route
          path="tickets/report"
          element={
            <RequirePerm screen="Work report">
              <WorkReport />
            </RequirePerm>
          }
        />
        <Route
          path="tickets/:ticketId"
          element={
            <RequirePerm screen="All tickets">
              <TicketDetail />
            </RequirePerm>
          }
        />

        <Route
          path="devices"
          element={
            <RequirePerm screen="Device list">
              <DeviceList />
            </RequirePerm>
          }
        />
        <Route
          path="devices/add"
          element={
            <RequirePerm screen="Add device" flag="c">
              <DeviceAdd />
            </RequirePerm>
          }
        />
        <Route
          path="devices/scan"
          element={
            <RequirePerm screen="Scan QR">
              <ScanQr />
            </RequirePerm>
          }
        />
        <Route
          path="devices/:deviceId"
          element={
            <RequirePerm screen="Device history">
              <DeviceDetail />
            </RequirePerm>
          }
        />

        <Route
          path="masters/issues"
          element={
            <RequirePerm screen="Issue master">
              <IssueMaster />
            </RequirePerm>
          }
        />
        <Route
          path="masters/roads"
          element={
            <RequirePerm screen="Road master">
              <RoadList />
            </RequirePerm>
          }
        />
        <Route
          path="masters/roads/add"
          element={
            <RequirePerm screen="Road master" flag="c">
              <RoadAdd />
            </RequirePerm>
          }
        />
        <Route
          path="masters/parts"
          element={
            <RequirePerm screen="Update ticket">
              <PartMaster />
            </RequirePerm>
          }
        />

        <Route
          path="users"
          element={
            <RequirePerm screen="Users">
              <Users />
            </RequirePerm>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Unknown paths for guests and signed-in users (outside AppLayout chrome). */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
