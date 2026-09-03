import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'

function Placeholder({ pageId, title, crumb, label }) {
  return (
    <>
      <PageMeta pageId={pageId} title={title} crumb={crumb} />
      <main className="page">
        <p className="text-[15px] font-semibold text-[var(--ink)]">{label}</p>
        <p className="mt-2 text-[13px] text-[var(--ink-3)]">
          Phase 1 placeholder — full UI lands in a later phase.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => toast('Design preview — shell OK.')}
        >
          Test toast
        </button>
      </main>
    </>
  )
}

export function TicketListPage() {
  return (
    <Placeholder
      pageId="ticket-list"
      title="All tickets"
      crumb="83 open · 412 closed this year"
      label="All tickets (Phase 1 placeholder)"
    />
  )
}

export function TicketRaisePage() {
  return (
    <Placeholder
      pageId="ticket-raise"
      title="Raise ticket"
      crumb="Tickets › New ticket"
      label="Raise ticket (Phase 1 placeholder)"
    />
  )
}

export function TicketUpdatePage() {
  return (
    <Placeholder
      pageId="ticket-update"
      title="Update ticket"
      crumb="Tickets › TK-1042 › Site visit"
      label="Update ticket (Phase 1 placeholder)"
    />
  )
}

export function TicketClosePage() {
  return (
    <Placeholder
      pageId="ticket-close"
      title="Close ticket"
      crumb="Tickets › TK-1042 › Close"
      label="Close ticket (Phase 1 placeholder)"
    />
  )
}

export function TicketDetailPage() {
  return (
    <Placeholder
      pageId="ticket-detail"
      title="TK-1042"
      crumb="Tickets › PD-0428 › Science City, Slot S2-114"
      label="Ticket detail (Phase 1 placeholder)"
    />
  )
}

export function WorkReportPage() {
  return (
    <Placeholder
      pageId="ticket-report"
      title="Work report"
      crumb="Tickets › Work report"
      label="Work report (Phase 1 placeholder)"
    />
  )
}

export function DeviceListPage() {
  return (
    <Placeholder
      pageId="device-list"
      title="Device list"
      crumb="1,000 devices across 5 roads"
      label="Device list (Phase 1 placeholder)"
    />
  )
}

export function DeviceDetailPage() {
  return (
    <Placeholder
      pageId="device-detail"
      title="Device history"
      crumb="Devices › PD-0428 › Science City, Slot S2-114"
      label="Device history (Phase 1 placeholder)"
    />
  )
}

export function DeviceAddPage() {
  return (
    <Placeholder
      pageId="device-add"
      title="Add device"
      crumb="Devices › New device"
      label="Add device (Phase 1 placeholder)"
    />
  )
}

export function ScanQrPage() {
  return (
    <Placeholder
      pageId="scan-qr"
      title="Scan QR"
      crumb="Devices › Scan a QR sticker"
      label="Scan QR (Phase 1 placeholder)"
    />
  )
}

export function IssueMasterPage() {
  return (
    <Placeholder
      pageId="issue-master"
      title="Issue master"
      crumb="Masters › Issue category and sub-category"
      label="Issue master (Phase 1 placeholder)"
    />
  )
}

export function RoadListPage() {
  return (
    <Placeholder
      pageId="road-list"
      title="Road master"
      crumb="5 roads · 1,000 devices mapped"
      label="Road master (Phase 1 placeholder)"
    />
  )
}

export function RoadAddPage() {
  return (
    <Placeholder
      pageId="road-add"
      title="Add road"
      crumb="Road master › New road"
      label="Add road (Phase 1 placeholder)"
    />
  )
}

export function UsersPage() {
  return (
    <Placeholder
      pageId="users"
      title="Users"
      crumb="Who can see and do what in the system"
      label="Users (Phase 1 placeholder)"
    />
  )
}
