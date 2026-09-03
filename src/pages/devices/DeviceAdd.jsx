import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../context/PageMetaContext'
import { toast } from '../../context/ToastContext'
import { ROAD_OPTIONS } from '../../data/slots'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Panel } from '../../components/ui/Panel'

export default function DeviceAdd() {
  const [road, setRoad] = useState('')
  const [slot, setSlot] = useState('')
  const [side, setSide] = useState('Left')
  const [landmark, setLandmark] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [model, setModel] = useState('Flap barrier — 4 wheeler')
  const [installed, setInstalled] = useState('')
  const [commissioned, setCommissioned] = useState('')
  const [status, setStatus] = useState('Working')
  const [photo, setPhoto] = useState('')
  const [remarks, setRemarks] = useState('')

  const crumb = useMemo(
    () => (
      <>
        <Link to="/devices">Devices</Link> › New device
      </>
    ),
    [],
  )

  const actions = useMemo(
    () => (
      <Link className="btn" to="/devices">
        Back to list
      </Link>
    ),
    [],
  )

  function handleSubmit(e, mode) {
    e.preventDefault()
    if (mode === 'print') {
      toast('Design preview — device saved and QR label would print.')
      return
    }
    if (mode === 'another') {
      toast('Design preview — device saved. Form ready for another.')
      return
    }
    toast('Design preview — device saved.')
  }

  return (
    <>
      <PageMeta pageId="device-add" title="Add device" crumb={crumb} actions={actions} />

      <main className="page" style={{ maxWidth: 980 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(e, 'save')
          }}
        >
          <Panel
            title="Device and QR"
            subtitle="The QR sticker on the machine is what a technician scans on site"
          >
            <div className="form-grid">
              <Field label="Device ID" required hint="Generated in sequence. This is the number used everywhere in the system.">
                <input type="text" value="PD-1001" readOnly />
              </Field>
              <Field
                label="QR code"
                required
                hint="Printed and pasted on the machine body. Print the label after saving."
              >
                <input type="text" value="QR-PD1001" readOnly />
              </Field>
              <Field label="Model">
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  <option>Flap barrier — 4 wheeler</option>
                  <option>Flap barrier — 2 wheeler</option>
                </select>
              </Field>
            </div>
          </Panel>

          <Panel
            title="Where it is installed"
            subtitle="Roads come from the road master, so add the road first if it is missing"
            link="Add a road"
            linkTo="/masters/roads/add"
          >
            <div className="form-grid">
              <Field label="Road" required>
                <select value={road} onChange={(e) => setRoad(e.target.value)}>
                  <option value="">Select road</option>
                  {ROAD_OPTIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Slot number"
                required
                hint="Uses the prefix set on the road. Must match the number painted on site."
              >
                <input
                  type="text"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  placeholder="e.g. CG-33"
                />
              </Field>
              <Field label="Side of road">
                <select value={side} onChange={(e) => setSide(e.target.value)}>
                  <option>Left</option>
                  <option>Right</option>
                </select>
              </Field>
              <Field label="Nearest landmark">
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Helps the technician find the slot"
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="23.0225"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="72.5714"
                />
              </Field>
            </div>
          </Panel>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Installation</h3>
                <p>When the device went live on this slot</p>
              </div>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                <Field label="Installation date" required>
                  <input
                    type="date"
                    value={installed}
                    onChange={(e) => setInstalled(e.target.value)}
                  />
                </Field>
                <Field label="Commissioned on">
                  <input
                    type="date"
                    value={commissioned}
                    onChange={(e) => setCommissioned(e.target.value)}
                  />
                </Field>
                <Field
                  label="Status"
                  required
                  hint="After go-live the status changes on its own from open tickets, not by hand."
                >
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>Working</option>
                    <option>Under installation</option>
                    <option>Not working</option>
                  </select>
                </Field>
                <Field label="Installation photo" className="span-2">
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="Upload — geo-tagged photo of the installed slot"
                  />
                </Field>
                <Field label="Remarks" className="span-2">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Site conditions worth recording — waterlogging point, tight slot, heavy two-wheeler entry, and so on."
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary">
                Save device
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, 'print')}>
                Save and print QR label
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, 'another')}>
                Save and add another
              </Button>
              <div className="right">
                <Link className="btn" to="/devices">
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
