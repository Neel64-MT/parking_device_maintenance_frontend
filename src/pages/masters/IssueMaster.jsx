import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import {
  ISSUE_MASTER,
  ISSUE_USAGE,
  issueSubCount,
} from '../../data/issueMaster'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Pill, SeverityPill } from '../../components/ui/Pill'

export default function IssueMaster() {
  const [current, setCurrent] = useState(0)
  const [query, setQuery] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [subName, setSubName] = useState('')
  const [severity, setSeverity] = useState('Critical')
  const catNameRef = useRef(null)
  const subNameRef = useRef(null)

  const category = ISSUE_MASTER[current]

  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return category.subs
    return category.subs.filter((s) => s.name.toLowerCase().includes(q))
  }, [category, query])

  function openCatForm() {
    setCatOpen((v) => !v)
    setTimeout(() => catNameRef.current?.focus(), 0)
  }

  function openSubForm() {
    setSubOpen((v) => !v)
    setTimeout(() => subNameRef.current?.focus(), 0)
  }

  function saveCategory(e) {
    e.preventDefault()
    toast('Design preview — category would be saved here.')
    setCatOpen(false)
    setCatName('')
  }

  function saveSub(e) {
    e.preventDefault()
    toast('Design preview — sub-category would be saved here.')
    setSubOpen(false)
    setSubName('')
    setSeverity('Critical')
  }

  return (
    <>
      <PageMeta
        pageId="issue-master"
        title="Issue master"
        crumb="Masters › Issue category and sub-category"
      />

      <main className="page">
        <div className="hint-strip">
          <div>
            <b>This list is what every ticket picks from.</b> Nothing is typed free-hand on a
            ticket, so keep the wording here the same as what a technician would say on site. Once
            a sub-category has been used on a ticket it can be made inactive, but not deleted —
            deleting it would break the history of every past repair.
          </div>
        </div>

        <div className="grid-master">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Categories</h3>
                <p>
                  {ISSUE_MASTER.length} categories · {issueSubCount()} sub-categories
                </p>
              </div>
              <div className="actions">
                <Button size="sm" variant="primary" onClick={openCatForm}>
                  Add
                </Button>
              </div>
            </div>

            <div className={`inline-form${catOpen ? ' open' : ''}`}>
              <form onSubmit={saveCategory}>
                <div className="row">
                  <Field label="Category name">
                    <input
                      ref={catNameRef}
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="e.g. Housekeeping"
                    />
                  </Field>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <Button type="submit" size="sm" variant="primary">
                    Save category
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setCatOpen(false)
                      setCatName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

            <div className="pick-list">
              {ISSUE_MASTER.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className={`pick${i === current ? ' on' : ''}`}
                  onClick={() => {
                    setCurrent(i)
                    setQuery('')
                  }}
                >
                  <span className="nm">{c.name}</span>
                  <span className="ct">{c.subs.length} sub</span>
                </button>
              ))}
            </div>

            <div className="foot-note">Nine categories cover every fault seen on site so far.</div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{category.name}</h3>
                <p>{category.subs.length} sub-categories</p>
              </div>
              <div className="actions">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sub-category"
                  style={{ minWidth: 160 }}
                  aria-label="Search sub-category"
                />
                <Button size="sm" variant="primary" onClick={openSubForm}>
                  Add sub-category
                </Button>
              </div>
            </div>

            <div className={`inline-form${subOpen ? ' open' : ''}`}>
              <form onSubmit={saveSub}>
                <div className="row">
                  <Field label="Sub-category name" style={{ flex: 2 }}>
                    <input
                      ref={subNameRef}
                      type="text"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g. Flap plate bent"
                    />
                  </Field>
                  <Field label="Severity">
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                      <option>Critical</option>
                      <option>Major</option>
                      <option>Minor</option>
                    </select>
                  </Field>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <Button type="submit" size="sm" variant="primary">
                    Save sub-category
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSubOpen(false)
                      setSubName('')
                      setSeverity('Critical')
                    }}
                  >
                    Cancel
                  </Button>
                  <span className="muted" style={{ marginLeft: 6 }}>
                    Severity decides how the ticket is prioritised and whether the device is counted
                    as down.
                  </span>
                </div>
              </form>
            </div>

            <div className="panel-body flush">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sub-category</th>
                      <th>Severity</th>
                      <th className="num">Tickets (90 days)</th>
                      <th>Status</th>
                      <th className="act">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((s) => {
                      const n = ISSUE_USAGE[s.name] || 0
                      return (
                        <tr key={s.name}>
                          <td>{s.name}</td>
                          <td>
                            <SeverityPill severity={s.severity} />
                          </td>
                          <td className="num">
                            {n ? (
                              <Link to="/tickets">{n}</Link>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                          <td>
                            <Pill tone="ok">Active</Pill>
                          </td>
                          <td className="act">
                            <Button size="sm" onClick={() => toast('Edit form opens here.')}>
                              Edit
                            </Button>{' '}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                toast(
                                  n
                                    ? `Used on ${n} tickets — can only be made inactive.`
                                    : 'Not used yet — safe to remove.',
                                )
                              }
                            >
                              {n ? 'Deactivate' : 'Delete'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="foot-note">
              Critical faults take the device to <em>Not working</em> on the dashboard. Minor faults
              leave it counted as working.
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
