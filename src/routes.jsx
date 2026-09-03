import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import {
  DeviceAddPage,
  DeviceDetailPage,
  DeviceListPage,
  IssueMasterPage,
  RoadAddPage,
  RoadListPage,
  ScanQrPage,
  UsersPage,
} from './pages/placeholders'
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
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dev/ui" element={<UiKitDemoPage />} />

        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/raise" element={<TicketRaise />} />
        <Route path="tickets/update" element={<TicketUpdate />} />
        <Route path="tickets/close" element={<TicketClose />} />
        <Route path="tickets/report" element={<WorkReport />} />
        <Route path="tickets/:ticketId" element={<TicketDetail />} />

        <Route path="devices" element={<DeviceListPage />} />
        <Route path="devices/add" element={<DeviceAddPage />} />
        <Route path="devices/scan" element={<ScanQrPage />} />
        <Route path="devices/:deviceId" element={<DeviceDetailPage />} />

        <Route path="masters/issues" element={<IssueMasterPage />} />
        <Route path="masters/roads" element={<RoadListPage />} />
        <Route path="masters/roads/add" element={<RoadAddPage />} />

        <Route path="users" element={<UsersPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
