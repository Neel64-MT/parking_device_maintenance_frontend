import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import {
  DashboardPage,
  DeviceAddPage,
  DeviceDetailPage,
  DeviceListPage,
  IssueMasterPage,
  RoadAddPage,
  RoadListPage,
  ScanQrPage,
  TicketClosePage,
  TicketDetailPage,
  TicketListPage,
  TicketRaisePage,
  TicketUpdatePage,
  UsersPage,
  WorkReportPage,
} from './pages/placeholders'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/raise" element={<TicketRaisePage />} />
        <Route path="tickets/update" element={<TicketUpdatePage />} />
        <Route path="tickets/close" element={<TicketClosePage />} />
        <Route path="tickets/report" element={<WorkReportPage />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage />} />

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
