import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { getDevice } from '../../services/devices'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { Pill } from '../../components/ui/Pill'
import { DeviceDetailSkeleton } from '../../components/ui/Skeleton'
import { Tile } from '../../components/ui/Tile'

function formatDate(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(value) {
  if (value == null || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatCost(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `₹ ${n.toLocaleString('en-IN')}`
}

function factDisplayValue(f) {
  if (f == null) return '—'
  if (typeof f === 'object' && 'value' in f) {
    const v = f.value
    if (v == null || v === '') return '—'
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return formatDate(v)
    return String(v)
  }
  return String(f)
}

export default function DeviceDetail() {
  const { deviceId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!deviceId) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('Device not found.')
          setData(null)
        }
        return
      }
      if (!cancelled) {
        setLoadError('')
        setLoading(true)
      }
      try {
        const result = await getDevice(deviceId)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiRequestError
              ? err.status === 403
                ? 'You do not have access to this device.'
                : err.status === 404
                  ? 'Device not found.'
                  : err.message
              : 'Could not load device history.'
          setLoadError(msg)
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [deviceId])

  const header = data?.header
  const lifeTiles = useMemo(() => data?.lifeTiles || [], [data])
  const tickets = data?.tickets || []
  const partHistory = data?.partHistory || []
  const partSummary = data?.partSummary || []
  const failRanks = data?.failRanks || []

  const totalDaysDown = useMemo(() => {
    const tile = lifeTiles.find((t) => /days down/i.test(t.label || ''))
    return tile?.value || '—'
  }, [lifeTiles])

  const totalSpend = useMemo(() => {
    const tile = lifeTiles.find((t) => /spent/i.test(t.label || ''))
    return tile?.value || '—'
  }, [lifeTiles])

  const crumb = useMemo(() => {
    if (!header) return null
    return (
      <>
        <Link to="/devices">Devices</Link> › {header.id} ›{' '}
        <Link to="/masters/roads">{header.road}</Link>, Slot {header.slot}
      </>
    )
  }, [header])

  const actions = useMemo(
    () => (
      <>
        <Link className="btn" to="/devices">
          Back to list
        </Link>
        <Link className="btn btn-primary" to="/tickets/raise">
          Raise ticket
        </Link>
      </>
    ),
    [],
  )

  return (
    <>
      <PageMeta pageId="device-detail" title="Device history" crumb={crumb} actions={actions} />

      <main className="page">
        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading ? <DeviceDetailSkeleton /> : null}

        {!loading && header ? (
          <>
            <section className="record">
              <div className="record-top">
                <div>
                  <h3>{header.id}</h3>
                  <div className="sub">
                    <b>{header.road || header.parkingLocation}</b> · Slot{' '}
                    <b>{header.slot || header.slotLabel}</b>
                    {header.qr || header.qrNumber ? (
                      <>
                        {' '}
                        · {header.qr || header.qrNumber}
                      </>
                    ) : null}
                  </div>
                </div>
                <div style={{ marginLeft: 20 }}>
                  <Pill tone={header.statusTone}>{header.status}</Pill>
                </div>
                <div className="push">
                  <Button onClick={() => toast('QR label sent to printer.', 'success')}>
                    Print QR label
                  </Button>
                  <Link
                    className="btn"
                    to={`/devices/add?id=${encodeURIComponent(deviceId || header.id)}`}
                  >
                    Edit device
                  </Link>
                </div>
              </div>

              <div className="facts">
                {(header.facts || []).map((f) => (
                  <div key={f.label}>
                    <small>{f.label}</small>
                    <span>{factDisplayValue(f)}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="tiles five">
              {lifeTiles.map((t) => (
                <Tile key={t.label} value={t.value} label={t.label} tone={t.tone} />
              ))}
            </div>

            <Panel
              title="Ticket and resolution"
              subtitle="What was reported on the left, what was actually done on the right"
              link="All tickets"
              linkTo="/tickets"
              flush
              foot={
                <>
                  Issue reported and issue found are separate on purpose — what the attendant says is rarely
                  what the technician finds, and only the second column is worth analysing.
                </>
              }
            >
              <div className="table-wrap">
                <table className="split">
                  <thead>
                    <tr>
                      <th colSpan={4} className="grp">
                        Ticket raised
                      </th>
                      <th colSpan={4} className="grp grp-alt">
                        Resolution
                      </th>
                    </tr>
                    <tr>
                      <th>Ticket</th>
                      <th>Raised on</th>
                      <th>Issue reported</th>
                      <th>Issue found</th>
                      <th className="sep">Status</th>
                      <th>Parts replaced</th>
                      <th className="num">Days open</th>
                      <th className="num">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!tickets.length ? (
                      <tr>
                        <td colSpan={8}>
                          <span className="muted">No tickets for this slot yet.</span>
                        </td>
                      </tr>
                    ) : null}
                    {tickets.map((row) => {
                      const cost = formatCost(row.cost)
                      const raisedTime = formatTime(row.raisedDate)
                      const daysOpen = row.daysOpen
                      const daysBad = Number(daysOpen) > 3
                      return (
                        <tr key={row.id}>
                          <td>
                            <Link className="code" to={`/tickets/${row.id}`}>
                              {row.id}
                            </Link>
                          </td>
                          <td>
                            {formatDate(row.raisedDate)}
                            {raisedTime ? <div className="muted">{raisedTime}</div> : null}
                          </td>
                          <td>
                            {row.reported || '—'}
                            {row.reportedCat ? <div className="muted">{row.reportedCat}</div> : null}
                          </td>
                          <td>
                            {row.found || '—'}
                            {row.foundCat ? <div className="muted">{row.foundCat}</div> : null}
                          </td>
                          <td className="sep">{row.status || '—'}</td>
                          <td>
                            <span className="muted">—</span>
                          </td>
                          <td className={`num${daysBad ? ' strong-bad' : ''}`}>
                            {daysOpen != null ? daysOpen : '—'}
                          </td>
                          <td className="num">
                            {cost ? cost : <span className="muted">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {tickets.length ? (
                    <tfoot>
                      <tr>
                        <td colSpan={6}>
                          <b>
                            {tickets.length} ticket{tickets.length === 1 ? '' : 's'} since installation
                          </b>
                        </td>
                        <td className="num">
                          <b>{totalDaysDown}</b>
                        </td>
                        <td className="num">
                          <b>{totalSpend}</b>
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </Panel>

            <div className="grid-2">
              <Panel
                title="Part replacement history"
                subtitle="Every part changed on this device, newest first"
                flush
              >
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Part replaced</th>
                        <th>Why</th>
                        <th>Ticket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!partHistory.length ? (
                        <tr>
                          <td colSpan={4}>
                            <span className="muted">No parts recorded yet.</span>
                          </td>
                        </tr>
                      ) : null}
                      {partHistory.map((row, i) => (
                        <tr key={`${row.ticketId}-${row.part}-${i}`}>
                          <td>{formatDate(row.date)}</td>
                          <td>
                            {row.part}
                            {row.note ? <div className="muted">{row.note}</div> : null}
                          </td>
                          <td>{row.why || '—'}</td>
                          <td>
                            {row.ticketId ? (
                              <Link className="code" to={`/tickets/${row.ticketId}`}>
                                {row.ticketId}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div>
                <Panel
                  title="Parts replaced so far"
                  subtitle="How many times each part has been changed"
                  flush
                >
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th className="num">Times replaced</th>
                          <th>Last replaced</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!partSummary.length ? (
                          <tr>
                            <td colSpan={3}>
                              <span className="muted">No parts recorded yet.</span>
                            </td>
                          </tr>
                        ) : null}
                        {partSummary.map((row) => (
                          <tr key={row.part}>
                            <td>{row.part}</td>
                            <td className={`num${row.timesBad ? ' strong-bad' : ''}`}>{row.times}</td>
                            <td>
                              {row.last ? formatDate(row.last) : <span className="muted">Original</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel
                  title="What keeps failing here"
                  subtitle={
                    tickets.length
                      ? `By category, over ${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`
                      : 'By category'
                  }
                  bodyStyle={{ paddingTop: 6 }}
                >
                  {!failRanks.length ? (
                    <p className="muted" style={{ padding: '8px 14px' }}>
                      No failure categories yet.
                    </p>
                  ) : null}
                  {failRanks.map((row) => (
                    <Link key={row.name} className="rank-row" to="/tickets">
                      <div className="name">{row.name}</div>
                      <div className="track">
                        <i className={row.hot ? 'hot' : undefined} style={{ width: row.width }} />
                      </div>
                      <div className="n">{row.n}</div>
                    </Link>
                  ))}
                </Panel>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </>
  )
}
