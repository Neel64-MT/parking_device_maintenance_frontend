import { useMemo, useRef, useState } from 'react'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { Tile } from '../ui/Tile'
import { SkeletonText } from '../ui/Skeleton'
import { toast, toastApiError } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { getEodReport } from '../../services/dashboard'
import { todayIstDate } from '../../utils/dateTime'
import { validateRange } from '../../utils/dateRange'
import { writeClipboard } from '../../utils/clipboard'
import { buildEodReportText, formatReportPeriod } from '../../utils/eodReportText'
import { DateRangeFilter } from './DateRangeFilter'

/**
 * EOD report: fetches the backend aggregate for an IST period (default today) on demand and
 * shows the exact plain text that Copy report puts on the clipboard.
 */
export function EodReportPanel() {
  const today = todayIstDate()
  const [{ from, to }, setRange] = useState({ from: today, to: today })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Only the latest request may update state; a period change also invalidates in-flight ones.
  const requestSeq = useRef(0)

  const rangeError = validateRange(from, to, today)
  const text = useMemo(() => (report ? buildEodReportText(report) : ''), [report])

  function changeRange(next) {
    requestSeq.current += 1
    setRange(next)
    setReport(null)
    setError('')
    setLoading(false)
  }

  async function generate() {
    if (rangeError) return
    const seq = ++requestSeq.current
    setLoading(true)
    setError('')
    try {
      const data = await getEodReport({ from, to })
      if (seq !== requestSeq.current) return
      setReport(data)
    } catch (err) {
      if (seq !== requestSeq.current) return
      setReport(null)
      setError(err instanceof ApiRequestError ? err.message : 'Could not generate the EOD report.')
      toastApiError(err, 'Could not generate the EOD report.')
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }

  async function copy() {
    if (!text) return
    try {
      await writeClipboard(text)
      toast('Report copied', 'success')
    } catch {
      toast('Could not copy', 'error')
    }
  }

  const shownError = rangeError || error

  return (
    <Panel
      className="eod-panel"
      title="EOD report generator"
      subtitle="Tickets raised and completed in the selected period (IST), ready to share"
      actions={
        <>
          <DateRangeFilter from={from} to={to} today={today} onChange={changeRange} label="Report" />
          <Button variant="primary" size="sm" onClick={generate} disabled={Boolean(rangeError)} aria-busy={loading}>
            {loading ? 'Generating…' : report ? 'Regenerate' : 'Generate report'}
          </Button>
          {report ? (
            <Button size="sm" onClick={copy} disabled={loading}>
              Copy report
            </Button>
          ) : null}
        </>
      }
    >
      {shownError ? (
        <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 0 }}>
          <span>{shownError}</span>
        </div>
      ) : null}

      {loading && !report ? <SkeletonText lines={4} /> : null}

      {!loading && !report && !shownError ? (
        <p className="muted" style={{ margin: 0 }}>
          Pick a period and click Generate report. Each click fetches the latest data.
        </p>
      ) : null}

      {report ? (
        <div aria-busy={loading}>
          <div className="tiles eod-tiles">
            <Tile value={report.summary.ticketsRaised} label="Tickets raised" />
            <Tile value={report.summary.ticketsClosed} label="Tickets completed" tone="ok" />
            <Tile value={report.summary.usersRaised} label="Users who raised" />
            <Tile value={report.summary.usersClosed} label="Users who completed" />
          </div>
          <p className="muted eod-caption">
            Report for {formatReportPeriod(report.from, report.to)}. The preview below is exactly what Copy report copies.
          </p>
          <pre className="eod-report" aria-label="Generated EOD report">
            {text}
          </pre>
        </div>
      ) : null}
    </Panel>
  )
}
