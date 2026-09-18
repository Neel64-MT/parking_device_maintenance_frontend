import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageMeta } from '../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../context/ToastContext'
import { ApiRequestError } from '../services/api'
import {
  canManageRolePermissions,
  canPerm,
  createRole as createRoleApi,
  createUser,
  filterAssignableRoles,
  homePathForUser,
  listRoles,
  listUsers,
  resetRolePermissions,
  updateRolePermissions,
  updateUser,
} from '../services/users'
import {
  PERM_FLAGS,
  PERM_SCREENS,
  ROLE_HELP,
  permOn,
  togglePermFlag,
} from '../data/users'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/FilterBar'
import { JumpLinks } from '../components/ui/JumpLinks'
import { Modal } from '../components/ui/Modal'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Pill } from '../components/ui/Pill'
import { SkeletonTable, SkeletonTiles } from '../components/ui/Skeleton'
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
  const { user, refresh } = useAuth()
  const canView = canPerm(user, 'Users', 'v')
  const canCreate = canPerm(user, 'Users', 'c')
  const canEdit = canPerm(user, 'Users', 'e')
  const canViewRoles = canPerm(user, 'Roles & permissions', 'v')
  const canCreateRole = canPerm(user, 'Roles & permissions', 'c')
  const canEditRoles = canPerm(user, 'Roles & permissions', 'e')
  const canViewWorkReport = canPerm(user, 'Work report', 'v')

  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tiles, setTiles] = useState([])
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rolesError, setRolesError] = useState('')
  const [rolesLoading, setRolesLoading] = useState(false)

  const [roleHelpOpen, setRoleHelpOpen] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [roleFormOpen, setRoleFormOpen] = useState(false)
  const [permRoleId, setPermRoleId] = useState('')
  const [permMap, setPermMap] = useState({})

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
  const [editOriginalRoleId, setEditOriginalRoleId] = useState('')
  const [editStatus, setEditStatus] = useState('Active')

  const [pwId, setPwId] = useState(null)
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

  const [creating, setCreating] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [creatingRole, setCreatingRole] = useState(false)
  const [savingPerms, setSavingPerms] = useState(false)

  const [roleName, setRoleName] = useState('')
  const [copyFrom, setCopyFrom] = useState('')
  const [scope, setScope] = useState('assigned_roads')

  const nameRef = useRef(null)
  const roleNameRef = useRef(null)
  const permRoleIdRef = useRef('')

  const selectedPermRole = useMemo(
    () => roles.find((r) => r.id === permRoleId) || null,
    [roles, permRoleId],
  )

  /** Roles `e` plus hierarchy; Admin matrix is locked. */
  const canEditSelectedRolePerms = Boolean(
    canEditRoles &&
      selectedPermRole &&
      selectedPermRole.name !== 'Admin' &&
      !selectedPermRole.permissionsLocked &&
      canManageRolePermissions(user?.role, selectedPermRole.name),
  )

  const canResetSelectedRolePerms = Boolean(
    canEditSelectedRolePerms && selectedPermRole?.canReset !== false && selectedPermRole?.defaultPermissions,
  )

  const selectPermRole = useCallback((role) => {
    if (!role || role.name === 'Admin' || role.permissionsLocked) {
      permRoleIdRef.current = ''
      setPermRoleId('')
      setPermMap({})
      return
    }
    permRoleIdRef.current = role.id
    setPermRoleId(role.id)
    setPermMap({ ...(role.permissions || {}) })
  }, [])

  const togglePerm = useCallback(
    (screen, flagIndex) => {
      if (!canEditSelectedRolePerms) return
      setPermMap((prev) => {
        const code = prev[screen] || '......'
        return { ...prev, [screen]: togglePermFlag(code, flagIndex) }
      })
    },
    [canEditSelectedRolePerms],
  )

  const assignableRoles = useMemo(
    () => filterAssignableRoles(user?.role, roles),
    [user?.role, roles],
  )

  const editRoleOptions = useMemo(() => {
    if (!editRoleId) return assignableRoles
    if (assignableRoles.some((r) => r.id === editRoleId)) return assignableRoles
    const current = roles.find((r) => r.id === editRoleId)
    return current ? [current, ...assignableRoles] : assignableRoles
  }, [assignableRoles, editRoleId, roles])

  const applyRolesList = useCallback(
    (list) => {
      setRoles(list)
      const allowed = filterAssignableRoles(user?.role, list)
      setRoleId((prev) => {
        if (prev && allowed.some((r) => r.id === prev)) return prev
        return allowed[0]?.id || ''
      })
      const prevPerm = permRoleIdRef.current
      const prevRow = list.find((r) => r.id === prevPerm)
      const nextPermId =
        prevPerm && prevRow && prevRow.name !== 'Admin' && !prevRow.permissionsLocked
          ? prevPerm
          : (
              list.find((r) => r.name === 'Technician') ||
              list.find((r) => r.name !== 'Admin' && !r.permissionsLocked) ||
              list[0]
            )?.id || ''
      permRoleIdRef.current = nextPermId
      setPermRoleId(nextPermId)
      const row = list.find((r) => r.id === nextPermId)
      if (row?.name === 'Admin' || row?.permissionsLocked) {
        setPermRoleId('')
        permRoleIdRef.current = ''
        setPermMap({})
      } else {
        setPermMap({ ...(row?.permissions || {}) })
      }
    },
    [user?.role],
  )

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

  const refreshRoles = useCallback(async () => {
    if (!canViewRoles && !canCreate && !canEdit) return null
    setRolesLoading(true)
    setRolesError('')
    try {
      const list = await listRoles()
      if (!Array.isArray(list)) {
        setRoles([])
        return []
      }
      applyRolesList(list)
      return list
    } catch (err) {
      setRolesError(err instanceof ApiRequestError ? err.message : 'Could not load roles.')
      return null
    } finally {
      setRolesLoading(false)
    }
  }, [canViewRoles, canCreate, canEdit, applyRolesList])

  useEffect(() => {
    let cancelled = false
    if (!canViewRoles && !canCreate && !canEdit) return undefined

    ;(async () => {
      setRolesLoading(true)
      setRolesError('')
      try {
        const list = await listRoles()
        if (cancelled) return
        if (!Array.isArray(list)) {
          setRoles([])
          return
        }
        applyRolesList(list)
      } catch (err) {
        if (cancelled) return
        setRolesError(err instanceof ApiRequestError ? err.message : 'Could not load roles.')
      } finally {
        if (!cancelled) setRolesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [canViewRoles, canCreate, canEdit, applyRolesList])

  const effectiveRoleId = useMemo(() => {
    if (!roleId) return assignableRoles[0]?.id || ''
    if (assignableRoles.some((r) => r.id === roleId)) return roleId
    return assignableRoles[0]?.id || ''
  }, [assignableRoles, roleId])

  useEffect(() => {
    if (effectiveRoleId === roleId) return undefined
    const id = window.setTimeout(() => setRoleId(effectiveRoleId), 0)
    return () => window.clearTimeout(id)
  }, [effectiveRoleId, roleId])

  async function saveUser(e) {
    e.preventDefault()
    if (!canCreate || creating) return
    if (!assignableRoles.length) {
      toast('No roles you can assign.', 'error')
      return
    }
    if (!fullName.trim() || !mobile.trim() || !password || !effectiveRoleId) {
      toast('Name, mobile, password and role are required.', 'error')
      return
    }
    if (!assignableRoles.some((r) => r.id === effectiveRoleId)) {
      toast('You cannot create a user with a role higher than your own.', 'error')
      return
    }
    setCreating(true)
    try {
      await createUser({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim() || '',
        password,
        roleId: effectiveRoleId,
        roadIds: [],
        status: 'Active',
      })
      toastApiSuccess('User created.')
      setUserFormOpen(false)
      setFullName('')
      setMobile('')
      setEmail('')
      setPassword('')
      setRoleId(assignableRoles[0]?.id || '')
      await refreshUsers()
    } catch (err) {
      toastApiError(err, 'Could not create user.')
    } finally {
      setCreating(false)
    }
  }

  async function approveUser(id) {
    if (!canEdit || approvingId) return
    setApprovingId(id)
    try {
      await updateUser(id, { status: 'Active' })
      toastApiSuccess('User approved.')
      await refreshUsers()
    } catch (err) {
      toastApiError(err, 'Could not approve user.')
    } finally {
      setApprovingId(null)
    }
  }

  function openEdit(row) {
    setEditId(row.id)
    setEditName(row.name)
    setEditMobile(row.mobile || '')
    setEditEmail(row.email || '')
    setEditRoleId(row.roleId || '')
    setEditOriginalRoleId(row.roleId || '')
    setEditStatus(row.status)
    setPwId(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!canEdit || !editId || savingEdit) return
    const mobileValue = editMobile.trim()
    if (mobileValue.length < 10) {
      toast('Mobile number must be at least 10 digits.', 'error')
      return
    }
    const roleChanged = Boolean(editRoleId) && editRoleId !== editOriginalRoleId
    if (roleChanged && !assignableRoles.some((r) => r.id === editRoleId)) {
      toast('You cannot create a user with a role higher than your own.', 'error')
      return
    }
    setSavingEdit(true)
    try {
      const body = {
        fullName: editName.trim(),
        mobile: mobileValue,
        email: editEmail.trim(),
        status: editStatus,
      }
      if (roleChanged) body.roleId = editRoleId
      await updateUser(editId, body)
      toastApiSuccess('User updated.')
      setEditId(null)
      await refreshUsers()
    } catch (err) {
      toastApiError(err, 'Could not update user.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (!canEdit || !pwId || savingPassword) return
    if (pwNew.length < 8) {
      toast('Password must be at least 8 characters.', 'error')
      return
    }
    if (pwNew !== pwConfirm) {
      toast('Passwords do not match.', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await updateUser(pwId, { password: pwNew })
      toastApiSuccess('Password updated.')
      setPwId(null)
      setPwNew('')
      setPwConfirm('')
    } catch (err) {
      toastApiError(err, 'Could not change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function submitCreateRole(e) {
    e.preventDefault()
    if (!canCreateRole || creatingRole) return
    if (roleName.trim().length < 2) {
      toast('Role name must be at least 2 characters.', 'error')
      return
    }
    setCreatingRole(true)
    try {
      await createRoleApi({
        name: roleName.trim(),
        scope: scope === 'all_roads' ? 'all_roads' : 'assigned_roads',
        copyFromRoleId: copyFrom || null,
      })
      toastApiSuccess('Role created.')
      setRoleFormOpen(false)
      setRoleName('')
      setCopyFrom('')
      setScope('assigned_roads')
      await refreshRoles()
    } catch (err) {
      toastApiError(err, 'Could not create role.')
    } finally {
      setCreatingRole(false)
    }
  }

  async function savePermissions() {
    if (!canEditSelectedRolePerms || !permRoleId || savingPerms) return
    setSavingPerms(true)
    try {
      await updateRolePermissions(permRoleId, permMap)
      toastApiSuccess('Permissions saved.')
      const savedName = selectedPermRole?.name
      await refreshRoles()
      if (savedName && savedName === user?.role) {
        await refresh()
      }
    } catch (err) {
      toastApiError(err, 'Could not save permissions.')
    } finally {
      setSavingPerms(false)
    }
  }

  async function resetPermissions() {
    if (!canResetSelectedRolePerms || !permRoleId || savingPerms) return
    setSavingPerms(true)
    try {
      const data = await resetRolePermissions(permRoleId)
      const nextMap = data?.permissions || selectedPermRole?.defaultPermissions || {}
      setPermMap({ ...nextMap })
      toastApiSuccess('Permissions reset to defaults.')
      const savedName = selectedPermRole?.name
      await refreshRoles()
      if (savedName && savedName === user?.role) {
        await refresh()
      }
    } catch (err) {
      toastApiError(err, 'Could not reset permissions.')
    } finally {
      setSavingPerms(false)
    }
  }

  const activeCount = rows.filter((r) => r.status === 'Active').length
  const pendingCount = rows.filter((r) => r.status === 'Pending').length

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

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
            ...(canViewWorkReport
              ? [{ to: '/tickets/report', label: 'Work report' }]
              : []),
            { to: '/tickets', label: 'All tickets' },
            { to: '/dashboard', label: 'Dashboard' },
          ]}
        />

        {loading ? (
          <div aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading users</span>
            <SkeletonTiles count={4} />
          </div>
        ) : (
          <div className="tiles five">
            {tiles.map((t) => (
              <Tile key={t.label} value={t.value} label={t.label} />
            ))}
          </div>
        )}

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
            { id: 'roles', label: 'Roles & permissions', count: roles.length },
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
                      hint=""
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
                      {assignableRoles.length ? (
                        <select
                          value={effectiveRoleId}
                          onChange={(e) => setRoleId(e.target.value)}
                          disabled={creating}
                        >
                          {assignableRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="muted" style={{ margin: 0 }}>
                          No roles you can assign.
                        </p>
                      )}
                    </Field>
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      disabled={creating || !assignableRoles.length}
                    >
                      {creating ? 'Creating…' : 'Save user'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creating}
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
                    {loading ? <SkeletonTable rows={6} cols={8} /> : null}
                    {!loading && !rows.length ? (
                      <tr>
                        <td colSpan={8}>
                          <span className="muted">No users match this search.</span>
                        </td>
                      </tr>
                    ) : null}
                    {!loading
                      ? rows.map((row) => (
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
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={!!approvingId}
                                onClick={() => approveUser(row.id)}
                              >
                                {approvingId === row.id ? 'Approving…' : 'Approve'}
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
                    ))
                      : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="foot-note">
              A user is never deleted, only made inactive — their name has to stay readable on the
              tickets they closed. Signup requests stay Pending until an Admin or Project Manager
              approves them.
            </div>
          </section>
        ) : null}

        {tab === 'roles' ? (
          <div>
            {!canViewRoles ? (
              <section className="panel">
                <div className="hint-strip auth-error" style={{ margin: 16 }} role="alert">
                  <span>You do not have permission to view roles and permissions.</span>
                </div>
              </section>
            ) : (
              <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Roles</h3>
                  <p>Pick a role to see and edit what it can do</p>
                </div>
                <div className="actions">
                  {canCreateRole ? (
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
                  ) : null}
                </div>
              </div>

              {canCreateRole ? (
                <div className={`inline-form${roleFormOpen ? ' open' : ''}`}>
                  <form onSubmit={submitCreateRole}>
                    <div className="row">
                      <Field label="Role name">
                        <input
                          ref={roleNameRef}
                          type="text"
                          value={roleName}
                          onChange={(e) => setRoleName(e.target.value)}
                          placeholder="e.g. Store keeper"
                          disabled={creatingRole}
                        />
                      </Field>
                      <Field label="Copy permissions from">
                        <select
                          value={copyFrom}
                          onChange={(e) => setCopyFrom(e.target.value)}
                          disabled={creatingRole}
                        >
                          <option value="">Start with nothing</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Scope"
                        hint="Decides whether the person sees the whole city or only their stretch."
                      >
                        <select
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                          disabled={creatingRole}
                        >
                          <option value="assigned_roads">Only roads assigned to the user</option>
                          <option value="all_roads">All roads</option>
                        </select>
                      </Field>
                    </div>
                    <div className="row" style={{ marginTop: 12 }}>
                      <Button type="submit" size="sm" variant="primary" disabled={creatingRole}>
                        {creatingRole ? 'Creating…' : 'Create role'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingRole}
                        onClick={() => {
                          setRoleFormOpen(false)
                          setRoleName('')
                          setCopyFrom('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}

              <div className="panel-body flush">
                {rolesError ? (
                  <div className="hint-strip auth-error" style={{ margin: 16 }} role="alert">
                    <span>{rolesError}</span>
                  </div>
                ) : null}
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
                      {rolesLoading && !roles.length ? <SkeletonTable rows={5} cols={5} /> : null}
                      {!rolesLoading && !roles.length ? (
                        <tr>
                          <td colSpan={5}>
                            <span className="muted">No roles found.</span>
                          </td>
                        </tr>
                      ) : null}
                      {roles.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <b>{row.name}</b>
                          </td>
                          <td>{row.scope}</td>
                          <td className="num">{row.users ?? 0}</td>
                          <td>{row.note || '—'}</td>
                          <td className="act">
                            {row.name === 'Admin' || row.permissionsLocked ? (
                              <span className="muted">Full access</span>
                            ) : (
                              <Button size="sm" onClick={() => selectPermRole(row)}>
                                Permissions
                              </Button>
                            )}
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
                  <h3>Permissions — {selectedPermRole?.name || '—'}</h3>
                  <p>
                    {!selectedPermRole
                      ? 'Select a role to review its permissions.'
                      : canEditSelectedRolePerms
                        ? 'Tick what this role is allowed to do. Reset restores the seeded defaults.'
                        : canEditRoles
                          ? 'View only — this role is above yours; you cannot change its matrix'
                          : 'View only — you cannot change this matrix'}
                  </p>
                </div>
                <div className="actions">
                  {canResetSelectedRolePerms ? (
                    <Button
                      size="sm"
                      disabled={savingPerms || !permRoleId}
                      onClick={resetPermissions}
                    >
                      {savingPerms ? 'Working…' : 'Reset to defaults'}
                    </Button>
                  ) : null}
                  {canEditSelectedRolePerms ? (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={savingPerms || !permRoleId}
                      onClick={savePermissions}
                    >
                      {savingPerms ? 'Saving…' : 'Save changes'}
                    </Button>
                  ) : null}
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
                            const code = permMap[scr] || '......'
                            return (
                              <tr key={scr}>
                                <td>{scr.replace(/ master$/i, '')}</td>
                                {PERM_FLAGS.map((flag, i) => (
                                  <td key={flag}>
                                    <input
                                      type="checkbox"
                                      checked={permOn(code, i)}
                                      disabled={!canEditSelectedRolePerms || savingPerms || !permRoleId}
                                      onChange={() => togglePerm(scr, i)}
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
              <div className="foot-note">
                {selectedPermRole?.note || 'Select a role to review its permissions.'}
              </div>
            </section>
              </>
            )}
          </div>
        ) : null}
      </main>

      <Modal
        open={!!editId}
        wide
        title="Edit user"
        subtitle="Update name, contact, role or status"
        closeDisabled={savingEdit}
        onClose={() => {
          if (savingEdit) return
          setEditId(null)
        }}
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
              hint=""
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
              <select
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
                disabled={savingEdit || !editRoleOptions.length}
              >
                {editRoleOptions.map((r) => (
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
            <Button type="submit" variant="primary" disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" disabled={savingEdit} onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!pwId}
        title="Update password"
        subtitle="Set a new password for this user"
        closeDisabled={savingPassword}
        onClose={() => {
          if (savingPassword) return
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
            <Button type="submit" variant="primary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </Button>
            <Button
              type="button"
              disabled={savingPassword}
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
