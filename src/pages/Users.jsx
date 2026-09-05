import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'
import { ApiRequestError } from '../services/api'
import { canPerm, createUser, listRoles, listUsers, updateUser } from '../services/users'
import {
  PERM_FLAGS,
  PERM_SCREENS,
  ROLE_HELP,
  ROLE_ROWS,
  ROLES,
  permOn,
} from '../data/users'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/FilterBar'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Modal } from '../components/ui/Modal'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Pill } from '../components/ui/Pill'
import { Tabs } from '../components/ui/Tabs'
import { Tile } from '../components/ui/Tile'

function formatLastActive(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Users() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Users', 'v')
  const canCreate = canPerm(user, 'Users', 'c')
  const canEdit = canPerm(user, 'Users', 'e')

  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tiles, setTiles] = useState([])
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [roleHelpOpen, setRoleHelpOpen] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [permRole, setPermRole] = useState('Technician')

  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')

  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editMobile, setEditMobile] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRoleId, setEditRoleId] = useState('')
  const [editStatus, setEditStatus] = useState('Active')

  const [pwId, setPwId] = useState(null)
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const [roleName, setRoleName] = useState('')
  const [copyFrom, setCopyFrom] = useState('Start with nothing')
  const [scope, setScope] = useState('Only roads assigned to the user')

  const nameRef = useRef(null)
  const roleNameRef = useRef(null)

  const roleDef = ROLES[permRole]

  const refreshUsers = useCallback(async () => {
    if (!canView) {
      setLoading(false)
      setLoadError('You do not have permission to view users.')
      return
    }
    setLoadError('')
    try {
      const data = await listUsers({ q: query, status: statusFilter })
      setTiles(data.tiles || [])
      setRows(data.users || [])
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [canView, query, statusFilter])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!canView) {
        if (!cancelled) {
          setLoading(false)
          setLoadError('You do not have permission to view users.')
        }
        return
      }
      if (!cancelled) setLoadError('')
      try {
        const data = await listUsers({ q: query, status: statusFilter })
        if (cancelled) return
        setTiles(data.tiles || [])
        setRows(data.users || [])
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load users.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canView, query, statusFilter])

  useEffect(() => {
    if (!canCreate && !canEdit) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listRoles()
        if (cancelled || !Array.isArray(list)) return
        setRoles(list)
        setRoleId((prev) => prev || list[0]?.id || '')
      } catch {
        /* Roles list optional for view-only users */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canCreate, canEdit])

  async function saveUser(e) {
    e.preventDefault()
    if (!canCreate) return
    if (!fullName.trim() || !mobile.trim() || !password || !roleId) {
      toast('Name, mobile, password and role are required.')
      return
    }
    try {
      await createUser({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || '',
        password,
        roleId,
        roadIds: [],
        status: 'Active',
      })
      toast('User created.')
      setUserFormOpen(false)
      setFullName('')
      setMobile('')
      setEmail('')
      setPassword('')
      await refreshUsers()
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not create user.')
    }
  }

  async function approveUser(id) {
    if (!canEdit) return
    try {
      await updateUser(id, { status: 'Active' })
      toast('User approved.')
      await refreshUsers()
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not approve user.')
    }
  }

  function openEdit(row) {
    setEditId(row.id)
    setEditName(row.name)
    setEditMobile(row.mobile || '')
    setEditEmail(row.email || '')
    setEditRoleId(row.roleId || '')
    setEditStatus(row.status)
    setPwId(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!canEdit || !editId) return
    const mobileValue = editMobile.trim()
    if (mobileValue.length < 10) {
      toast('Mobile number must be at least 10 digits.')
      return
    }
    try {
      await updateUser(editId, {
        fullName: editName.trim(),
        mobile: mobileValue,
        email: editEmail.trim(),
        roleId: editRoleId || undefined,
        status: editStatus,
      })
      toast('User updated.')
      setEditId(null)
      await refreshUsers()
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update user.')
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (!canEdit || !pwId) return
    if (pwNew.length < 8) {
      toast('Password must be at least 8 characters.')
      return
    }
    if (pwNew !== pwConfirm) {
      toast('Passwords do not match.')
      return
    }
    try {
      await updateUser(pwId, { password: pwNew })
      toast('Password updated.')
      setPwId(null)
      setPwNew('')
      setPwConfirm('')
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not change password.')
    }
  }

  function createRole(e) {
    e.preventDefault()
    toast('Design preview — role would be created here.')
    setRoleFormOpen(false)
    setRoleName('')
    setCopyFrom('Start with nothing')
    setScope('Only roads assigned to the user')
  }

  const activeCount = rows.filter((r) => r.status === 'Active').length
  const pendingCount = rows.filter((r) => r.status === 'Pending').length

  return (
    <>
      <PageMeta
        pageId="users"
        title="Users"
        crumb="Who can see and do what in the system"
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
          {tiles.map((t) => (
            <Tile key={t.label} value={t.value} label={t.label} />
          ))}
        </div>

        <div className={`collapse-filter${filtersOpen ? ' open' : ''}`}>
          <button
            type="button"
            className="collapse-filter-toggle"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters
            <span className="chev" aria-hidden="true" />
          </button>
          <div className="collapse-filter-body">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or mobile"
              style={{ minWidth: 190 }}
              aria-label="Search users"
            />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="push">
              {canCreate ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setUserFormOpen((v) => !v)
                    setTab('users')
                    setFiltersOpen(true)
                    setTimeout(() => nameRef.current?.focus(), 0)
                  }}
                >
                  Add user
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'users', label: 'Users', count: rows.length },
            { id: 'roles', label: 'Roles & permissions', count: ROLE_ROWS.length },
          ]}
        />

        {tab === 'users' ? (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Users</h3>
                <p>
                  {rows.length} shown
                  {pendingCount ? ` · ${pendingCount} pending` : ''}
                  {activeCount ? ` · ${activeCount} active` : ''}
                </p>
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

            {canCreate ? (
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
                    <Field label="Email">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="optional"
                      />
                    </Field>
                    <Field label="Password" hint="At least 8 characters.">
                      <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Temporary password"
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Role">
                      <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
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
                        setEmail('')
                        setPassword('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="panel-body flush">
              {loadError ? (
                <div className="hint-strip auth-error" style={{ margin: 16 }} role="alert">
                  <span>{loadError}</span>
                </div>
              ) : null}
              {loading ? <p className="muted" style={{ padding: 16 }}>Loading users…</p> : null}
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
                    {!loading && !rows.length ? (
                      <tr>
                        <td colSpan={8}>
                          <span className="muted">No users match this search.</span>
                        </td>
                      </tr>
                    ) : null}
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.name}
                          {row.you ? <div className="muted">You</div> : null}
                          {row.email ? <div className="muted">{row.email}</div> : null}
                        </td>
                        <td>{row.mobile}</td>
                        <td>{row.role}</td>
                        <td>{row.roads}</td>
                        <td className={`num${row.openBad ? ' strong-bad' : ''}`}>
                          {row.openTickets != null ? (
                            <Link to="/tickets">{row.openTickets}</Link>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>{formatLastActive(row.lastActive)}</td>
                        <td>
                          <Pill tone={row.statusTone || 'grey'}>{row.status}</Pill>
                        </td>
                        <td className="act">
                          {canEdit && row.status === 'Pending' ? (
                            <>
                              <Button size="sm" variant="primary" onClick={() => approveUser(row.id)}>
                                Approve
                              </Button>{' '}
                            </>
                          ) : null}
                          {canEdit ? (
                            <>
                              <Button size="sm" onClick={() => openEdit(row)}>
                                Edit
                              </Button>{' '}
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPwId(row.id)
                                  setEditId(null)
                                  setPwNew('')
                                  setPwConfirm('')
                                }}
                              >
                                Password
                              </Button>
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="foot-note">
              A user is never deleted, only made inactive — their name has to stay readable on the
              tickets they closed. Signup requests stay Pending until an Admin approves them.
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

      <Modal
        open={!!editId}
        wide
        title="Edit user"
        subtitle="Update name, contact, role or status"
        onClose={() => setEditId(null)}
      >
        <form onSubmit={saveEdit}>
          <div className="form-grid">
            <Field label="Full name" required>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </Field>
            <Field
              label="Mobile number"
              required
              hint="Also the login ID. Ticket alerts go to this number."
            >
              <input
                type="tel"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                placeholder="10-digit number"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="optional"
              />
            </Field>
            <Field label="Role">
              <select value={editRoleId} onChange={(e) => setEditRoleId(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <Button type="submit" variant="primary">
              Save changes
            </Button>
            <Button type="button" onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pwId}
        title="Update password"
        subtitle="Set a new password for this user"
        onClose={() => {
          setPwId(null)
          setPwNew('')
          setPwConfirm('')
        }}
      >
        <form onSubmit={savePassword}>
          <Field label="New password" required hint="At least 8 characters.">
            <PasswordInput
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password" required>
            <PasswordInput
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Field>
          <div className="modal-actions">
            <Button type="submit" variant="primary">
              Update password
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPwId(null)
                setPwNew('')
                setPwConfirm('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
