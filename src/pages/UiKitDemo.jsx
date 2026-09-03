import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'
import { ISSUE_MASTER, issueSubCount } from '../data/issueMaster'
import { useTableSearch } from '../hooks/useTableSearch'
import { Button } from '../components/ui/Button'
import { DeviceCard } from '../components/ui/DeviceCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, FilterBar } from '../components/ui/FilterBar'
import { IssueSelects } from '../components/ui/IssueSelects'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Panel } from '../components/ui/Panel'
import { PartChips } from '../components/ui/PartChips'
import { PhotoPicker } from '../components/ui/PhotoPicker'
import { Pill, SeverityPill } from '../components/ui/Pill'
import { Tabs } from '../components/ui/Tabs'
import { TeamSelect } from '../components/ui/TeamSelect'
import { Tile } from '../components/ui/Tile'
import { Views } from '../components/ui/Views'

/**
 * Scratch route for Phase 2 visual check — not in the main menu.
 * Visit /dev/ui
 */
export function UiKitDemoPage() {
  const [tab, setTab] = useState('new')
  const [view, setView] = useState('day')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [assignee, setAssignee] = useState('Assign later — control room will decide')
  const { query, setQuery, filterRows } = useTableSearch()

  const categories = useMemo(
    () =>
      filterRows(
        ISSUE_MASTER.map((c) => ({ name: c.name, subs: c.subs.length })),
        (r) => `${r.name} ${r.subs}`,
      ),
    [filterRows],
  )

  return (
    <>
      <PageMeta
        pageId="dashboard"
        title="UI kit (Phase 2)"
        crumb="Scratch route · not in menu · /dev/ui"
      />
      <main className="page">
        <JumpLinks
          links={[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/tickets', label: 'Tickets' },
            { to: '/devices', label: 'Devices' },
          ]}
        />

        <div className="hint-strip">
          <div>
            <b>Phase 2 primitives demo.</b> {ISSUE_MASTER.length} categories ·{' '}
            {issueSubCount()} sub-categories loaded from{' '}
            <code>src/data/issueMaster.js</code>.
          </div>
        </div>

        <div className="tiles">
          <Tile value={ISSUE_MASTER.length} label="Categories" />
          <Tile value={issueSubCount()} label="Sub-categories" tone="ok" />
          <Tile value="41" label="Under repair" tone="warn" />
          <Tile value="42" label="Not working" tone="bad" />
        </div>

        <FilterBar
          actions={
            <>
              <Button onClick={() => setQuery('')}>Reset</Button>
              <Button variant="dark" onClick={() => toast('Export is preview-only.')}>
                Export
              </Button>
            </>
          }
        >
          <Field label="Search categories">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Category name"
            />
          </Field>
          <Field label="Road">
            <select defaultValue="All roads">
              <option>All roads</option>
              <option>Science City</option>
            </select>
          </Field>
        </FilterBar>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'new', label: 'New', count: 42 },
            { id: 'asg', label: 'Assigned', count: 41 },
            { id: 'cls', label: 'Closed', count: 412 },
          ]}
        />

        <Panel
          title={`${tab === 'new' ? 'New' : tab === 'asg' ? 'Assigned' : 'Closed'} preview`}
          subtitle="Tabs + panel pairing"
          linkTo="/tickets"
          link="All tickets"
          flush
          foot={
            <>
              Filtered rows: {categories.length}
              <Link to="/masters/issues">Issue master</Link>
            </>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Subs</th>
                  <th>Sample severity</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const sample = ISSUE_MASTER.find((x) => x.name === c.name)?.subs[0]
                  return (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td className="num">{c.subs}</td>
                      <td>
                        {sample ? <SeverityPill severity={sample.severity} /> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid-2-even">
          <Panel title="Buttons & pills" subtitle="Shared variants">
            <div className="stack-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Button onClick={() => toast('Default button')}>Default</Button>
              <Button variant="primary" onClick={() => toast('Primary')}>
                Primary
              </Button>
              <Button variant="dark">Dark</Button>
              <Button variant="danger" size="sm">
                Danger sm
              </Button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="ok">Working</Pill>
              <Pill tone="warn">Under repair</Pill>
              <Pill tone="bad">Not working</Pill>
              <Pill tone="info">Info</Pill>
              <Pill>Grey</Pill>
            </div>
          </Panel>

          <Panel title="Views" subtitle="Work report switcher">
            <Views
              value={view}
              onChange={setView}
              views={[
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'range', label: 'Date range' },
              ]}
            />
            <p className="muted" style={{ marginTop: 12 }}>
              Active view: <b>{view}</b>
            </p>
          </Panel>
        </div>

        <Panel title="Issue selects & team" subtitle="Ticket form building blocks">
          <div className="form-grid">
            <IssueSelects
              category={category}
              subCategory={subCategory}
              onCategoryChange={setCategory}
              onSubCategoryChange={setSubCategory}
            />
            <Field label="Assign to" className="span-2">
              <TeamSelect
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                firstOption="Assign later — control room will decide"
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Parts & photos" subtitle="Update / close flows">
          <Field label="Parts changed">
            <PartChips defaultSelected={['Motor']} />
          </Field>
          <Field label="Photos" style={{ marginBottom: 0 }}>
            <PhotoPicker hint="Add as many photos as you need — the slot, the flap, the display." />
          </Field>
        </Panel>

        <Panel title="Device card" subtitle="Raise / update / scan">
          <DeviceCard
            id="PD-0428"
            location="Science City · Slot S2-114"
            facts={[
              { label: 'Status', value: 'Under repair' },
              { label: 'Installed', value: '02 Apr 2026' },
              { label: 'Tickets in 6 months', value: '6' },
            ]}
          />
        </Panel>

        <Panel title="Empty state">
          <EmptyState title="No device matches that code" action={<Button>Search device list</Button>}>
            Check the number on the sticker, or search the device list by slot number.
          </EmptyState>
        </Panel>
      </main>
    </>
  )
}
