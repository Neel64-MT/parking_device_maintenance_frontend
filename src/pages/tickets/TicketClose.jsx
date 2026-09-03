import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { DeviceCard } from '../../components/ui/DeviceCard'
import { Field } from '../../components/ui/FilterBar'
import { IssueSelects } from '../../components/ui/IssueSelects'
import { PartChips } from '../../components/ui/PartChips'
import { PhotoPicker } from '../../components/ui/PhotoPicker'

const COST_ROWS = [
  { date: '25 Aug', work: 'Diagnosis, board checked', cost: '₹ 0' },
  { date: '26 Aug', work: 'Gearbox confirmed seized', cost: '₹ 0' },
  { date: '30 Aug', work: 'Spare indented', cost: '₹ 0' },
  { date: '01 Sep', work: 'Motor assembly replaced', cost: '₹ 9,200' },
]

export default function TicketClose() {
  const [category, setCategory] = useState('Mechanical')
  const [subCategory, setSubCategory] = useState('Motor failure')

  const crumb = useMemo(
    () => (
      <>
        <Link to="/tickets">Tickets</Link> › <Link to="/tickets/TK-1042">TK-1042</Link> › Close
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/tickets/TK-1042">
        Ticket history
      </Link>
    ),
    [],
  )

  return (
    <>
      <PageMeta pageId="ticket-close" title="Close ticket" crumb={crumb} actions={actions} />

      <main className="page mobile">
        <section className="panel">
          <div className="panel-body">
            <DeviceCard
              id="PD-0428"
              location="Science City · Slot S2-114 · TK-1042"
              facts={[
                { label: 'Raised on', value: '24 Aug 2026' },
                {
                  label: 'Days open',
                  value: <span className="strong-bad">8 days</span>,
                },
                { label: 'Visits', value: '4' },
              ]}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="step-head">
              <div className="step-n">1</div>
              <div>
                <h3>Final issue</h3>
                <p>This is what the reports will count</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <div className="class-pair" style={{ margin: '-16px -18px 14px' }}>
              <div>
                <small>Reported on 24 Aug</small>
                <div className="big">Controller board failure</div>
                <div className="sub2">Electrical</div>
              </div>
              <div>
                <small>Confirmed on closure</small>
                <div className="big">Motor failure</div>
                <div className="sub2">Mechanical</div>
              </div>
            </div>

            <IssueSelects
              category={category}
              subCategory={subCategory}
              onCategoryChange={setCategory}
              onSubCategoryChange={setSubCategory}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="step-head">
              <div className="step-n">2</div>
              <div>
                <h3>How it was fixed</h3>
                <p>Written once, read every time this device comes up again</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <Field label="Work done">
              <textarea
                defaultValue="Replaced motor and gearbox assembly. Travel limits reset and tested with 5 open-close cycles. Pit checked for water, found dry."
                placeholder="e.g. Replaced motor and gearbox assembly, reset travel limits, tested 5 open-close cycles."
              />
            </Field>
            <Field label="Parts changed on this ticket">
              <PartChips defaultSelected={['Motor', 'Gearbox']} />
            </Field>
            <Field label="Photos" style={{ marginBottom: 0 }}>
              <PhotoPicker
                start={2}
                hint="Photos carried over from the visits on this ticket."
              />
            </Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="step-head">
              <div className="step-n">3</div>
              <div>
                <h3>Cost</h3>
                <p>What this ticket cost the company</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <Field label="Cost of this visit">
              <input type="number" placeholder="0" defaultValue="9200" />
            </Field>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Visit</th>
                    <th>Work</th>
                    <th className="num">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {COST_ROWS.map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{r.work}</td>
                      <td className="num">{r.cost}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>
                      <b>Total for TK-1042</b>
                    </td>
                    <td className="num">
                      <b>₹ 9,200</b>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="foot-note">
            Cost is entered per visit, so a ticket with three trips shows all three.
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="step-head">
              <div className="step-n">4</div>
              <div>
                <h3>Confirm</h3>
                <p>Closing puts the device back to working</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <Field
              label="Device tested and working"
              hint="PD-0428 has had 6 tickets in five months. If this one reopens within 7 days it comes back as the same ticket, not a new one."
              style={{ marginBottom: 0 }}
            >
              <select defaultValue="Yes, tested with 5 open-close cycles">
                <option>Yes, tested with 5 open-close cycles</option>
                <option>Yes, tested with a live transaction</option>
                <option>Not tested — keep the ticket open</option>
              </select>
            </Field>
          </div>
        </section>

        <div className="sticky-bar">
          <Link className="btn" to="/tickets/update">
            Back
          </Link>
          <Button
            variant="primary"
            onClick={() => toast('Design preview — ticket would be closed here.')}
          >
            Close ticket
          </Button>
        </div>
      </main>
    </>
  )
}
