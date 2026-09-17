import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { createPart, deletePart, listParts, updatePart } from '../../services/parts'
import { canPerm, homePathForUser } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'
import { SkeletonTable } from '../../components/ui/Skeleton'

function formatAmount(amount) {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN')}`
}

function EditIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export default function PartMaster() {
  const { user } = useAuth()
  const canView = user?.role !== 'Site attendant'
  const canCreate =
    canPerm(user, 'Issue master', 'c') || user?.role === 'Technician'
  const canUpdate =
    canPerm(user, 'Issue master', 'e') || user?.role === 'Technician'
  const canDelete = canPerm(user, 'Issue master', 'd')
  // Soft-deactivate uses PATCH — backend allows Issue master `e` or Technician.
  const canDeactivate =
    canPerm(user, 'Issue master', 'e') || user?.role === 'Technician'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(() => canView)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const nameRef = useRef(null)

  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const list = await listParts({ force: true })
      setRows(list)
    } catch (err) {
      setRows([])
      setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load parts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canView) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listParts({ force: true })
        if (!cancelled) setRows(list)
      } catch (err) {
        if (!cancelled) {
          setRows([])
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load parts.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canView])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q))
  }, [rows, query])

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  async function saveCreate(e) {
    e.preventDefault()
    if (!canCreate || creating) return
    const trimmed = name.trim()
    const amt = Number(amount)
    if (!trimmed) {
      toast('Part name is required.', 'error')
      return
    }
    if (Number.isNaN(amt) || amt < 0) {
      toast('Amount must be zero or more.', 'error')
      return
    }
    setCreating(true)
    try {
      await createPart({ name: trimmed, amount: amt })
      toastApiSuccess('Part created.')
      setFormOpen(false)
      setName('')
      setAmount('')
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not create part.')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(row) {
    setEditId(row.id)
    setEditName(row.name)
    setEditAmount(String(row.amount ?? 0))
    setEditActive(row.active !== false)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!canUpdate || !editId || savingEdit) return
    const trimmed = editName.trim()
    const amt = Number(editAmount)
    if (!trimmed) {
      toast('Part name is required.', 'error')
      return
    }
    if (Number.isNaN(amt) || amt < 0) {
      toast('Amount must be zero or more.', 'error')
      return
    }
    setSavingEdit(true)
    try {
      await updatePart(editId, {
        name: trimmed,
        amount: amt,
        active: editActive,
      })
      toastApiSuccess(
        editActive ? 'Part updated.' : 'Part updated and deactivated.',
      )
      setEditId(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not update part.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || deleting) return
    setDeleting(true)
    const { id, name: partName } = deleteTarget
    try {
      try {
        await deletePart(id)
        toastApiSuccess(`“${partName}” deleted.`)
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'IN_USE') {
          if (canDeactivate) {
            await updatePart(id, { active: false })
            toastApiSuccess(`“${partName}” is in use — deactivated instead.`)
          } else {
            toastApiError(err, 'Part is in use and cannot be deleted.')
            return
          }
        } else {
          throw err
        }
      }
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not delete part.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageMeta
        pageId="part-master"
        title="Parts"
        crumb="Masters › Parts used on ticket updates"
      />

      <main className="page">
        <div className="hint-strip">
          <div>
            <b>These parts appear on Update ticket and Add update.</b> Amounts are taken from this
            list when a visit is saved — technicians pick parts; the server calculates visit cost.
            Unused parts can be deleted; parts used on visits can only be made inactive.
          </div>
        </div>

        <div className="collapse-filter open">
          <div className="collapse-filter-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search part name"
              aria-label="Search parts"
              style={{ minWidth: 190 }}
            />
            <div className="push">
              {canCreate ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormOpen((v) => !v)
                    setTimeout(() => nameRef.current?.focus(), 0)
                  }}
                >
                  Add part
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Parts</h3>
              <p>
                {loading ? 'Loading…' : `${filtered.length} active part${filtered.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <div className={`inline-form${formOpen ? ' open' : ''}`}>
            <form onSubmit={saveCreate}>
              <div className="row">
                <Field label="Part name" required>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Motor"
                    disabled={creating}
                  />
                </Field>
                <Field label="Amount (₹)" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    disabled={creating}
                  />
                </Field>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <Button type="submit" size="sm" variant="primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Save part'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={creating}
                  onClick={() => {
                    setFormOpen(false)
                    setName('')
                    setAmount('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

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
                    <th>Part name</th>
                    <th className="num">Amount</th>
                    <th className="act">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <SkeletonTable rows={6} cols={3} /> : null}
                  {!loading && !filtered.length ? (
                    <tr>
                      <td colSpan={3}>
                        <span className="muted">
                          {query.trim() ? 'No parts match this search.' : 'No parts in master yet.'}
                        </span>
                      </td>
                    </tr>
                  ) : null}
                  {!loading
                    ? filtered.map((row) => (
                        <tr key={row.id}>
                          <td>{row.name}</td>
                          <td className="num">{formatAmount(row.amount)}</td>
                          <td className="act">
                            {canUpdate || canDelete ? (
                              <div className="act-row">
                                {canUpdate ? (
                                  <Button
                                    size="sm"
                                    className="btn-icon"
                                    title="Edit"
                                    aria-label={`Edit ${row.name}`}
                                    onClick={() => openEdit(row)}
                                  >
                                    <EditIcon />
                                  </Button>
                                ) : null}
                                {canDelete ? (
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    className="btn-icon"
                                    title="Delete"
                                    aria-label={`Delete ${row.name}`}
                                    disabled={deleting}
                                    onClick={() => setDeleteTarget(row)}
                                  >
                                    <TrashIcon />
                                  </Button>
                                ) : null}
                              </div>
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
            Unused parts can be hard-deleted. Parts used on visits stay in history and can only be
            made inactive from Edit. Technicians can create and update; delete needs Issue master
            delete permission. Site attendants cannot open this page.
          </div>
        </section>
      </main>

      <Modal
        open={!!editId}
        title="Edit part"
        subtitle="Name, amount, and status used on the next ticket update"
        closeDisabled={savingEdit}
        onClose={() => {
          if (savingEdit) return
          setEditId(null)
        }}
      >
        <form onSubmit={saveEdit}>
          <div className="form-grid">
            <Field label="Part name" required>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={savingEdit}
              />
            </Field>
            <Field label="Amount (₹)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={savingEdit}
              />
            </Field>
            {canDeactivate || canUpdate ? (
              <Field label="Status">
                <div className="status-switch">
                  <button
                    type="button"
                    className={`status-switch-track${editActive ? ' is-on' : ''}`}
                    role="switch"
                    aria-checked={editActive}
                    aria-label={editActive ? 'Active' : 'Inactive'}
                    disabled={savingEdit || !canDeactivate}
                    onClick={() => setEditActive((v) => !v)}
                  >
                    <span className="status-switch-knob" />
                  </button>
                  <span className="status-switch-label">
                    {editActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Field>
            ) : null}
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
        open={Boolean(deleteTarget)}
        title="Delete part?"
        subtitle="Unused parts are removed. Parts used on visits are deactivated instead."
        closeDisabled={deleting}
        onClose={() => {
          if (deleting) return
          setDeleteTarget(null)
        }}
      >
        <p className="muted" style={{ marginBottom: 16 }}>
          Delete <b>{deleteTarget?.name}</b>
          {deleteTarget ? ` (${formatAmount(deleteTarget.amount)})` : ''}?
        </p>
        <div className="modal-actions">
          <Button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
