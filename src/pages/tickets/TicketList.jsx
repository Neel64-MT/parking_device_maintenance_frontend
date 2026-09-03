import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ISSUE_MASTER } from '../../data/issueMaster'
import { ROAD_OPTIONS } from '../../data/slots'
import {
  TICKET_LIST_TILES,
  TICKET_ROWS,
  TICKET_TAB_COUNTS,
  TICKET_TAB_META,
} from '../../data/tickets'
import { Button } from '../../components/ui/Button'
import { Field, FilterBar } from '../../components/ui/FilterBar'
import { JumpLinks } from '../../components/ui/JumpLinks'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { Tabs } from '../../components/ui/Tabs'
import { Tile } from '../../components/ui/Tile'

const FILTER_DEFAULTS = {
  road: 'All roads',
  status: 'Open + under repair',
  category: 'All categories',
  assignee: 'Anyone',
}

export default function TicketList() {
  const [tab, setTab] = useState('new')
  const [query, setQuery] = useState('')
  const [road, setRoad] = useState(FILTER_DEFAULTS.road)
  const [status, setStatus] = useState(FILTER_DEFAULTS.status)
  const [category, setCategory] = useState(FILTER_DEFAULTS.category)
  const [assignee, setAssignee] = useState(FILTER_DEFAULTS.assignee)

  const meta = TICKET_TAB_META[tab]

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TICKET_ROWS.filter((row) => {
      if (row.tab !== tab) return false
      if (!q) return true
      const hay = [
        row.id,
        row.deviceId,
        row.road,
        row.slot,
        row.issueReported,
        row.issueReportedDetail,
        row.issueFound,
        row.issueFoundDetail,
        row.assignedTo,
        row.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [tab, query])

  const actions = useMemo(
    () => (
      <>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ticket, device or slot"
          style={{ minWidth: 190 }}
          aria-label="Search tickets"
        />
        <Link className="btn btn-primary" to="/tickets/raise">
          Raise ticket
        </Link>
      </>
    ),
    [query],
  )

  function handleTab(id) {
    setTab(id)
    setQuery('')
  }

  function resetFilters() {
    setRoad(FILTER_DEFAULTS.road)
    setStatus(FILTER_DEFAULTS.status)
    setCategory(FILTER_DEFAULTS.category)
    setAssignee(FILTER_DEFAULTS.assignee)
    setQuery('')
  }

  return (
    <>
      <PageMeta
        pageId="ticket-list"
        title="All tickets"
        crumb="83 open · 412 closed this year"
        actions={actions}
      />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets/raise', label: 'Raise a ticket' },
            { to: '/tickets/update', label: 'Update a ticket' },
            { to: '/tickets/report', label: 'Work report' },
            { to: '/devices', label: 'Devices' },
          ]}
        />

        <div className="tiles five">
          {TICKET_LIST_TILES.map((t) => (
            <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
          ))}
        </div>

        <FilterBar
          actions={
            <>
              <Button onClick={resetFilters}>Reset</Button>
              <Button variant="dark" onClick={() => toast('Design preview — export would run here.')}>
                Export
              </Button>
            </>
          }
        >
          <Field label="Road">
            <select value={road} onChange={(e) => setRoad(e.target.value)}>
              <option>All roads</option>
              {ROAD_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Open + under repair</option>
              <option>Open, not attended</option>
              <option>Under repair</option>
              <option>Waiting for spare</option>
              <option>Closed</option>
              <option>All</option>
            </select>
          </Field>
          <Field label="Issue category found">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All categories</option>
              {ISSUE_MASTER.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned to">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option>Anyone</option>
              <option>Ramesh Vaghela</option>
              <option>Jignesh Solanki</option>
              <option>Mahesh Thakor</option>
              <option>Not assigned</option>
            </select>
          </Field>
        </FilterBar>

        <Tabs
          value={tab}
          onChange={handleTab}
          tabs={[
            { id: 'new', label: 'New', count: TICKET_TAB_COUNTS.new },
            { id: 'asg', label: 'Assigned', count: TICKET_TAB_COUNTS.asg },
            { id: 'cls', label: 'Closed', count: TICKET_TAB_COUNTS.cls },
          ]}
        />

        <Panel
          title={meta.title}
          subtitle={meta.subtitle}
          link="Dashboard"
          linkTo="/dashboard"
          flush
          foot={
            <>
              Where reported and found differ, the found column is what reports count. Tickets with
              no inspection yet show blank until a technician logs the first visit.
              <Link to="/tickets/raise">Raise ticket</Link>
            </>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Device</th>
                  <th>Road / slot</th>
                  <th>Issue reported</th>
                  <th>Issue found</th>
                  <th>Assigned to</th>
                  <th className="num">Updates</th>
                  <th className="num">Days open</th>
                  <th>Status</th>
                  <th className="act" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="code" to={`/tickets/${row.id}`}>
                        {row.id}
                      </Link>
                    </td>
                    <td>
                      <Link className="code" to={`/devices/${row.deviceId}`}>
                        {row.deviceId}
                      </Link>
                    </td>
                    <td>
                      {row.road}
                      <div className="muted">{row.slot}</div>
                    </td>
                    <td>
                      {row.issueReported}
                      <div className="muted">{row.issueReportedDetail}</div>
                    </td>
                    <td>
                      {row.issueFound ? (
                        <>
                          {row.issueFound}
                          <div className="muted">{row.issueFoundDetail}</div>
                        </>
                      ) : (
                        <span className="muted">Not inspected yet</span>
                      )}
                    </td>
                    <td>
                      {row.assignedTo || <span className="muted">Not assigned</span>}
                    </td>
                    <td className="num">{row.updates}</td>
                    <td className={`num${row.daysBad ? ' strong-bad' : ''}`}>{row.daysOpen}</td>
                    <td>
                      <Pill tone={row.statusTone}>{row.status}</Pill>
                    </td>
                    <td className="act">
                      <Link
                        className={`btn btn-sm${row.actionPrimary ? ' btn-primary' : ''}`}
                        to={`/tickets/${row.id}`}
                      >
                        {row.actionLabel}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </>
  )
}
