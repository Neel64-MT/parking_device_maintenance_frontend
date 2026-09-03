import { Fragment, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'
import { ROAD_OPTIONS } from '../data/slots'
import {
  PERM_FLAGS,
  PERM_SCREENS,
  ROLE_HELP,
  ROLE_ROWS,
  ROLES,
  USER_ROWS,
  USER_TILES,
  permOn,
} from '../data/users'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/FilterBar'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Pill } from '../components/ui/Pill'
import { Tabs } from '../components/ui/Tabs'
import { Tile } from '../components/ui/Tile'

const ROLE_OPTIONS = [
  'Technician',
  'Site attendant',
  'Control room',
  'Project manager',
  'AMC officer (view only)',
  'Admin',
]

export default function Users() {
  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState('')
  const [roleHelpOpen, setRoleHelpOpen] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [permRole, setPermRole] = useState('Technician')

  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [role, setRole] = useState('Technician')
  const [roads, setRoads] = useState('All roads')

  const [roleName, setRoleName] = useState('')
  const [copyFrom, setCopyFrom] = useState('Start with nothing')
  const [scope, setScope] = useState('Only roads assigned to the user')

  const nameRef = useRef(null)
  const roleNameRef = useRef(null)

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return USER_ROWS
    return USER_ROWS.filter((row) => {
      const hay = [row.name, row.mobile, row.role, row.roads].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const roleDef = ROLES[permRole]

  const actions = useMemo(
    () => (
      <>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or mobile"
          style={{ minWidth: 190 }}
          aria-label="Search users"
        />
        <Button
          variant="primary"
          onClick={() => {
            setUserFormOpen((v) => !v)
            setTab('users')
            setTimeout(() => nameRef.current?.focus(), 0)
          }}
        >
          Add user
        </Button>
      </>
    ),
    [query],
  )

  function saveUser(e) {
    e.preventDefault()
    toast('Design preview — user would be saved here.')
    setUserFormOpen(false)
    setFullName('')
    setMobile('')
    setRole('Technician')
    setRoads('All roads')
  }

  function createRole(e) {
    e.preventDefault()
    toast('Design preview — role would be created here.')
    setRoleFormOpen(false)
    setRoleName('')
    setCopyFrom('Start with nothing')
    setScope('Only roads assigned to the user')
  }

  return (
    <>
      <PageMeta
        pageId="users"
        title="Users"
        crumb="Who can see and do what in the system"
        actions={actions}
      />

      <main className="page">
        <JumpLinks
          links={[
            { to: '/tickets/report', label: 'Work report' },
            { to: '/tickets', label: 'All tickets' },
            { to: '/dashboard', label: 'Dashboard' },
          ]}
        />

        <div className="tiles five">
          {USER_TILES.map((t) => (
            <Tile key={t.label} value={t.value} label={t.label} />
          ))}
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'users', label: 'Users', count: 18 },
            { id: 'roles', label: 'Roles & permissions', count: 6 },
          ]}
        />

        {tab === 'users' ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Users</h3>
                <p>18 users · 16 active</p>
              </div>
              <div className="actions">
                <Button size="sm" onClick={() => setRoleHelpOpen((v) => !v)}>
                  What each role can do
                </Button>
              </div>
            </div>

            <div className={`inline-form${roleHelpOpen ? ' open' : ''}`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Can do</th>
                      <th>Cannot do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLE_HELP.map((row) => (
                      <tr key={row.role}>
                        <td>
                          <b>{row.role}</b>
                        </td>
                        <td>{row.can}</td>
                        <td>{row.cannot}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`inline-form${userFormOpen ? ' open' : ''}`}>
              <form onSubmit={saveUser}>
                <div className="row">
                  <Field label="Full name">
                    <input
                      ref={nameRef}
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Vaghela"
                    />
                  </Field>
                  <Field
                    label="Mobile number"
                    hint="Also the login ID. Ticket alerts go to this number."
                  >
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit number"
                    />
                  </Field>
                  <Field label="Role">
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Roads assigned"
                    hint="A technician only sees devices and tickets on their assigned roads."
                  >
                    <select value={roads} onChange={(e) => setRoads(e.target.value)}>
                      <option>All roads</option>
                      {ROAD_OPTIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <Button type="submit" size="sm" variant="primary">
                    Save user
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setUserFormOpen(false)
                      setFullName('')
                      setMobile('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

            <div className="panel-body flush">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Roads assigned</th>
                      <th className="num">Open tickets</th>
                      <th>Last active</th>
                      <th>Status</th>
                      <th className="act">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((row) => (
                      <tr key={row.name}>
                        <td>
                          {row.name}
                          {row.you ? <div className="muted">You</div> : null}
                        </td>
                        <td>{row.mobile}</td>
                        <td>
                          {row.role}
                          {row.roleNote ? <div className="role-note">{row.roleNote}</div> : null}
                        </td>
                        <td>{row.roads}</td>
                        <td className={`num${row.openBad ? ' strong-bad' : ''}`}>
                          {row.openTickets != null ? (
                            <Link to="/tickets">{row.openTickets}</Link>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>{row.lastActive}</td>
                        <td>
                          <Pill tone={row.statusTone}>{row.status}</Pill>
                        </td>
                        <td className="act">
                          <Button size="sm" onClick={() => toast('Edit form opens here.')}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="foot-note">
              A user is never deleted, only made inactive — their name has to stay readable on the
              tickets they closed.
            </div>
          </section>
        ) : null}

        {tab === 'roles' ? (
          <div>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Roles</h3>
                  <p>Pick a role to see and edit what it can do</p>
                </div>
                <div className="actions">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setRoleFormOpen((v) => !v)
                      setTimeout(() => roleNameRef.current?.focus(), 0)
                    }}
                  >
                    Add role
                  </Button>
                </div>
              </div>

              <div className={`inline-form${roleFormOpen ? ' open' : ''}`}>
                <form onSubmit={createRole}>
                  <div className="row">
                    <Field label="Role name">
                      <input
                        ref={roleNameRef}
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g. Store keeper"
                      />
                    </Field>
                    <Field label="Copy permissions from">
                      <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                        <option>Start with nothing</option>
                        <option>Technician</option>
                        <option>Site attendant</option>
                        <option>Control room</option>
                      </select>
                    </Field>
                    <Field
                      label="Scope"
                      hint="Decides whether the person sees the whole city or only their stretch."
                    >
                      <select value={scope} onChange={(e) => setScope(e.target.value)}>
                        <option>Only roads assigned to the user</option>
                        <option>All roads</option>
                      </select>
                    </Field>
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <Button type="submit" size="sm" variant="primary">
                      Create role
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setRoleFormOpen(false)
                        setRoleName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>

              <div className="panel-body flush">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Scope</th>
                        <th className="num">Users</th>
                        <th>What it is for</th>
                        <th className="act">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROLE_ROWS.map((row) => (
                        <tr key={row.name}>
                          <td>
                            <b>{row.name}</b>
                          </td>
                          <td>{row.scope}</td>
                          <td className="num">
                            {row.usersLink ? (
                              <Link to="/tickets">{row.users}</Link>
                            ) : (
                              row.users
                            )}
                          </td>
                          <td>{row.purpose}</td>
                          <td className="act">
                            <Button size="sm" onClick={() => setPermRole(row.name)}>
                              Permissions
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Permissions — {permRole}</h3>
                  <p>Tick what this role is allowed to do</p>
                </div>
                <div className="actions">
                  <Button size="sm" variant="primary" onClick={() => toast('Permissions saved.')}>
                    Save changes
                  </Button>
                </div>
              </div>
              <div className="panel-body flush">
                <div className="table-wrap">
                  <table className="perm">
                    <thead>
                      <tr>
                        <th>Screen</th>
                        <th>View</th>
                        <th>Create</th>
                        <th>Edit</th>
                        <th>Assign</th>
                        <th>Close</th>
                        <th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERM_SCREENS.map(([group, screens]) => (
                        <Fragment key={group}>
                          <tr className="grp-row">
                            <td colSpan={7}>{group}</td>
                          </tr>
                          {screens.map((scr) => {
                            const code = roleDef.p[scr] || '......'
                            return (
                              <tr key={scr}>
                                <td>{scr}</td>
                                {PERM_FLAGS.map((flag, i) => (
                                  <td key={flag}>
                                    <input
                                      type="checkbox"
                                      checked={permOn(code, i)}
                                      onChange={() => {}}
                                    />
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="foot-note">{roleDef.note}</div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
