import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import { createPart, listParts, updatePart } from '../../services/parts'
import { canPerm, homePathForUser } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'
import { SkeletonTable } from '../../components/ui/Skeleton'

function formatAmount(amount) {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN')}`
}

export default function PartMaster() {
  const { user } = useAuth()
  const canView = user?.role !== 'Site attendant'
  const canCreate =
    canPerm(user, 'Issue master', 'c') || user?.role === 'Technician'
  const canUpdate =
    canPerm(user, 'Issue master', 'e') || user?.role === 'Technician'
  const canDeactivate = canPerm(user, 'Issue master', 'e')

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
  const [savingEdit, setSavingEdit] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState(null)

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
      await updatePart(editId, { name: trimmed, amount: amt })
      toastApiSuccess('Part updated.')
      setEditId(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not update part.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function deactivate(id) {
    if (!canDeactivate || deactivatingId) return
    setDeactivatingId(id)
    try {
      await updatePart(id, { active: false })
      toastApiSuccess('Part made inactive.')
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not deactivate part.')
    } finally {
      setDeactivatingId(null)
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
            Make a part inactive instead of deleting it so past visits keep their snapshot.
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
                            {canUpdate || canDeactivate ? (
                              <>
                                {canUpdate ? (
                                  <Button size="sm" onClick={() => openEdit(row)}>
                                    Edit
                                  </Button>
                                ) : null}
                                {canUpdate && canDeactivate ? ' ' : null}
                                {canDeactivate ? (
                                  <Button
                                    size="sm"
                                    disabled={!!deactivatingId}
                                    onClick={() => deactivate(row.id)}
                                  >
                                    {deactivatingId === row.id ? '…' : 'Deactivate'}
                                  </Button>
                                ) : null}
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
            Deactivated parts drop off ticket pickers but stay on past visit history. Technicians can
            create and update parts; deactivate needs Issue edit permission. Site attendants cannot
            open this page.
          </div>
        </section>
      </main>

      <Modal
        open={!!editId}
        title="Edit part"
        subtitle="Name and amount used on the next ticket update"
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
    </>
  )
}
