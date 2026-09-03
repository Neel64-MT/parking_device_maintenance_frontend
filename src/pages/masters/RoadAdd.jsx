import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'

export default function RoadAdd() {
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [zone, setZone] = useState('West Zone')
  const [ward, setWard] = useState('')
  const [length, setLength] = useState('')
  const [side, setSide] = useState('Both sides')
  const [slots, setSlots] = useState('')
  const [sanctioned, setSanctioned] = useState('')
  const [vehicle, setVehicle] = useState('Four-wheeler only')
  const [rate, setRate] = useState('')
  const [prefix, setPrefix] = useState('')
  const [hours, setHours] = useState('')
  const [status, setStatus] = useState('Operational')
  const [goLive, setGoLive] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [mobile, setMobile] = useState('')
  const [remarks, setRemarks] = useState('')

  const crumb = useMemo(
    () => (
      <>
        <Link to="/masters/roads">Road master</Link> › New road
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/masters/roads">
        Back to list
      </Link>
    ),
    [],
  )

  function handleSubmit(e, mode) {
    e.preventDefault()
    if (mode === 'another') {
      toast('Design preview — road saved. Form ready for another.')
      return
    }
    toast('Design preview — road saved.')
  }

  return (
    <>
      <PageMeta pageId="road-add" title="Add road" crumb={crumb} actions={actions} />

      <main className="page" style={{ maxWidth: 980 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e, 'save')
          }}
        >
          <Panel
            title="Road details"
            subtitle="Devices are mapped to a road, so add the road before adding devices"
          >
            <div className="form-grid">
              <Field
                label="Road code"
                required
                hint="Generated automatically. Printed on the device label."
              >
                <input type="text" value="RD-06" readOnly />
              </Field>
              <Field label="Road name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Prahladnagar Road"
                />
              </Field>
              <Field label="Stretch from" required>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Starting landmark"
                />
              </Field>
              <Field label="Stretch to" required>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Ending landmark"
                />
              </Field>
              <Field label="Zone">
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option>West Zone</option>
                  <option>East Zone</option>
                  <option>North Zone</option>
                  <option>South Zone</option>
                  <option>South West Zone</option>
                  <option>North West Zone</option>
                  <option>Central Zone</option>
                </select>
              </Field>
              <Field label="Ward">
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Ward 12"
                />
              </Field>
              <Field label="Stretch length">
                <input
                  type="text"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g. 1.4 km"
                />
              </Field>
              <Field label="Side of road">
                <select value={side} onChange={(e) => setSide(e.target.value)}>
                  <option>Both sides</option>
                  <option>Left side only</option>
                  <option>Right side only</option>
                </select>
              </Field>
            </div>
          </Panel>

          <Panel
            title="Capacity and parking rate"
            subtitle="Surveyed slot capacity and the rate approved for this stretch"
          >
            <div className="form-grid">
              <Field
                label="Surveyed slots"
                hint="Capacity found during site survey, not the installed count."
              >
                <input
                  type="number"
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  placeholder="e.g. 80"
                />
              </Field>
              <Field
                label="Devices sanctioned"
                hint="Installed device count updates on its own from the device master."
              >
                <input
                  type="number"
                  value={sanctioned}
                  onChange={(e) => setSanctioned(e.target.value)}
                  placeholder="e.g. 75"
                />
              </Field>
              <Field label="Vehicle type allowed">
                <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                  <option>Four-wheeler only</option>
                  <option>Two-wheeler only</option>
                  <option>Both</option>
                </select>
              </Field>
              <Field label="Parking rate">
                <input
                  type="text"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 20 per hour"
                />
              </Field>
              <Field
                label="Slot numbering prefix"
                hint="Slots on this road will be numbered PN-01, PN-02 and so on."
              >
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. PN"
                />
              </Field>
              <Field label="Operating hours">
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. 08:00 to 22:00"
                />
              </Field>
            </div>
          </Panel>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Status and site contact</h3>
                <p>Used for routing maintenance tickets raised on this road</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                <Field
                  label="Status"
                  required
                  hint="A road on hold keeps its devices but stops raising downtime alerts."
                >
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>Operational</option>
                    <option>On hold</option>
                    <option>Under installation</option>
                    <option>Closed</option>
                  </select>
                </Field>
                <Field label="Go-live date">
                  <input
                    type="date"
                    value={goLive}
                    onChange={(e) => setGoLive(e.target.value)}
                  />
                </Field>
                <Field label="Site supervisor">
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="Name"
                  />
                </Field>
                <Field label="Supervisor mobile">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit number"
                  />
                </Field>
                <Field label="Remarks" className="span-2">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Anything the maintenance team should know about this stretch — footpath work pending, frequent two-wheeler entry, waterlogging point, and so on."
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary">
                Save road
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, 'another')}>
                Save and add another
              </Button>
              <div className="right">
                <Link className="btn" to="/masters/roads">
                  Cancel
                </Link>
              </div>
            </div>
          </section>
        </form>
      </main>
    </>
  )
}
