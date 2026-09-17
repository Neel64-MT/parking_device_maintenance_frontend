import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageMeta } from '../../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../../context/ToastContext'
import { ApiRequestError } from '../../services/api'
import {
  createIssueCategory,
  createIssueSubcategory,
  deactivateIssueSubcategory,
  deleteIssueCategory,
  deleteIssueSubcategory,
  listIssueCategories,
  updateIssueCategory,
  updateIssueSubcategory,
} from '../../services/issues'
import { canPerm, homePathForUser } from '../../services/users'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/FilterBar'
import { Modal } from '../../components/ui/Modal'
import { SeverityPill } from '../../components/ui/Pill'
import { SkeletonTable } from '../../components/ui/Skeleton'

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

export default function IssueMaster() {
  const { user } = useAuth()
  const canView = canPerm(user, 'Issue master', 'v')
  const canCreate = canPerm(user, 'Issue master', 'c')
  const canEdit = canPerm(user, 'Issue master', 'e')
  // Sub edit: Issue master `e`, or Technician / Engineer (matches backend authorizeIssueSubUpdate).
  const canEditSub =
    canEdit || user?.role === 'Technician' || user?.role === 'Engineer'
  const canDelete = canPerm(user, 'Issue master', 'd')

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(() => canView)
  const [loadError, setLoadError] = useState('')
  const [currentId, setCurrentId] = useState('')
  const [query, setQuery] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [subName, setSubName] = useState('')
  const [severity, setSeverity] = useState('Critical')
  const catNameRef = useRef(null)
  const subNameRef = useRef(null)

  const [confirmSub, setConfirmSub] = useState(null)
  const [confirmCat, setConfirmCat] = useState(null)
  const [editSub, setEditSub] = useState(null)
  const [editSubName, setEditSubName] = useState('')
  const [editSubSeverity, setEditSubSeverity] = useState('Critical')
  const [editSubActive, setEditSubActive] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)
  const [busyAction, setBusyAction] = useState(false)
  const [creatingCat, setCreatingCat] = useState(false)
  const [creatingSub, setCreatingSub] = useState(false)

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const list = await listIssueCategories({ force: true })
      setCategories(list)
      setCurrentId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev
        return list[0]?.id || ''
      })
    } catch (err) {
      setCategories([])
      setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load issues.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canView) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listIssueCategories({ force: true })
        if (cancelled) return
        setCategories(list)
        setCurrentId(list[0]?.id || '')
      } catch (err) {
        if (!cancelled) {
          setCategories([])
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load issues.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canView])

  const category = useMemo(
    () => categories.find((c) => c.id === currentId) || categories[0] || null,
    [categories, currentId],
  )

  const filteredSubs = useMemo(() => {
    const subs = category?.subs || []
    const q = query.trim().toLowerCase()
    if (!q) return subs
    return subs.filter((s) => s.name.toLowerCase().includes(q))
  }, [category, query])

  const subCount = useMemo(
    () => categories.reduce((n, c) => n + (c.subs?.length || 0), 0),
    [categories],
  )

  if (!canView) {
    return <Navigate to={homePathForUser(user)} replace />
  }

  function openCatForm() {
    setCatOpen((v) => !v)
    setTimeout(() => catNameRef.current?.focus(), 0)
  }

  function openSubForm() {
    setSubOpen((v) => !v)
    setTimeout(() => subNameRef.current?.focus(), 0)
  }

  async function saveCategory(e) {
    e.preventDefault()
    if (!canCreate || creatingCat) return
    const trimmed = catName.trim()
    if (trimmed.length < 2) {
      toast('Category name needs at least 2 characters.', 'error')
      return
    }
    setCreatingCat(true)
    try {
      const row = await createIssueCategory({ name: trimmed })
      toastApiSuccess('Category created.')
      setCatOpen(false)
      setCatName('')
      await refresh()
      const newId = row?.id != null ? String(row.id) : ''
      if (newId) setCurrentId(newId)
    } catch (err) {
      toastApiError(err, 'Could not create category.')
    } finally {
      setCreatingCat(false)
    }
  }

  async function saveSub(e) {
    e.preventDefault()
    if (!canCreate || creatingSub) return
    if (!category?.id) {
      toast('Select a category first.', 'error')
      return
    }
    const trimmed = subName.trim()
    if (trimmed.length < 2) {
      toast('Sub-category name needs at least 2 characters.', 'error')
      return
    }
    setCreatingSub(true)
    const keepId = category.id
    try {
      await createIssueSubcategory({
        categoryId: keepId,
        name: trimmed,
        severity,
      })
      toastApiSuccess('Sub-category created.')
      setSubOpen(false)
      setSubName('')
      setSeverity('Critical')
      await refresh()
      setCurrentId(keepId)
    } catch (err) {
      toastApiError(err, 'Could not create sub-category.')
    } finally {
      setCreatingSub(false)
    }
  }

  async function confirmRemoveSub() {
    if (!canDelete || !confirmSub || busyAction) return
    setBusyAction(true)
    const { id, name } = confirmSub
    try {
      try {
        await deleteIssueSubcategory(id)
        toastApiSuccess(`“${name}” deleted.`)
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'IN_USE') {
          await deactivateIssueSubcategory(id)
          toastApiSuccess(`“${name}” is in use — deactivated instead.`)
        } else {
          throw err
        }
      }
      setConfirmSub(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not delete sub-category.')
    } finally {
      setBusyAction(false)
    }
  }

  async function confirmDeleteCategory() {
    if (!canDelete || !confirmCat || busyAction) return
    setBusyAction(true)
    const { id, name } = confirmCat
    try {
      try {
        await deleteIssueCategory(id)
        toastApiSuccess(`Category “${name}” deleted.`)
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === 'IN_USE') {
          if (canEdit) {
            await updateIssueCategory(id, { active: false })
            toastApiSuccess(`Category “${name}” is in use — deactivated instead.`)
          } else {
            toastApiError(err, 'Category is in use and cannot be deleted.')
            return
          }
        } else {
          throw err
        }
      }
      setConfirmCat(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not delete category.')
    } finally {
      setBusyAction(false)
    }
  }

  function openEditSub(s) {
    setEditSub(s)
    setEditSubName(s.name || '')
    setEditSubSeverity(s.severity || 'Critical')
    setEditSubActive(s.active !== false)
  }

  async function saveEditSub(e) {
    e.preventDefault()
    if (!canEditSub || !editSub || savingEdit) return
    const trimmed = editSubName.trim()
    if (trimmed.length < 2) {
      toast('Sub-category name needs at least 2 characters.', 'error')
      return
    }
    setSavingEdit(true)
    try {
      await updateIssueSubcategory(editSub.id, {
        name: trimmed,
        severity: editSubSeverity,
        active: editSubActive,
      })
      toastApiSuccess(
        editSubActive ? 'Sub-category updated.' : 'Sub-category updated and deactivated.',
      )
      setEditSub(null)
      await refresh()
    } catch (err) {
      toastApiError(err, 'Could not update sub-category.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <>
      <PageMeta
        pageId="issue-master"
        title="Issue"
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

        {loadError ? (
          <div className="hint-strip auth-error" role="alert" style={{ marginBottom: 16 }}>
            <span>{loadError}</span>
          </div>
        ) : null}

        <div className="grid-master">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Categories</h3>
                <p>
                  {loading
                    ? 'Loading…'
                    : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} · ${subCount} sub-categories`}
                </p>
              </div>
              <div className="actions">
                {canCreate ? (
                  <Button size="sm" variant="primary" onClick={openCatForm}>
                    Add
                  </Button>
                ) : null}
              </div>
            </div>

            {canCreate ? (
              <div className={`inline-form${catOpen ? ' open' : ''}`}>
                <form onSubmit={saveCategory}>
                  <div className="row">
                    <Field label="Category name" required>
                      <input
                        ref={catNameRef}
                        type="text"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder="e.g. Housekeeping"
                        disabled={creatingCat}
                      />
                    </Field>
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <Button type="submit" size="sm" variant="primary" disabled={creatingCat}>
                      {creatingCat ? 'Creating…' : 'Save category'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingCat}
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
            ) : null}

            <div className="pick-list">
              {loading && !categories.length ? (
                <p className="muted" style={{ padding: 12 }}>
                  Loading categories…
                </p>
              ) : null}
              {!loading && !categories.length ? (
                <p className="muted" style={{ padding: 12 }}>
                  No issue categories yet.
                </p>
              ) : null}
              {categories.map((c) => (
                <div key={c.id} className="pick-row">
                  <button
                    type="button"
                    className={`pick${c.id === category?.id ? ' on' : ''}`}
                    onClick={() => {
                      setCurrentId(c.id)
                      setQuery('')
                    }}
                  >
                    <span className="nm">{c.name}</span>
                    <span className="ct">{c.subs.length} sub</span>
                  </button>
                  {canDelete ? (
                    <Button
                      size="sm"
                      variant="danger"
                      className="btn-icon pick-row-del"
                      disabled={busyAction}
                      onClick={() => setConfirmCat(c)}
                      title="Delete category"
                      aria-label={`Delete ${c.name}`}
                    >
                      <TrashIcon />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="foot-note">
              Unused categories can be hard-deleted (subs cascade). Categories used on tickets are
              deactivated instead when you have edit permission.
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{category?.name || 'Sub-categories'}</h3>
                <p>
                  {loading
                    ? 'Loading…'
                    : `${category?.subs?.length || 0} sub-categor${(category?.subs?.length || 0) === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
              <div className="actions">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sub-category"
                  style={{ minWidth: 160 }}
                  aria-label="Search sub-category"
                  disabled={!category}
                />
                {canCreate ? (
                  <Button size="sm" variant="primary" onClick={openSubForm} disabled={!category}>
                    Add sub-category
                  </Button>
                ) : null}
              </div>
            </div>

            {canCreate ? (
              <div className={`inline-form${subOpen ? ' open' : ''}`}>
                <form onSubmit={saveSub}>
                  <div className="row">
                    <Field label="Sub-category name" style={{ flex: 2 }} required>
                      <input
                        ref={subNameRef}
                        type="text"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        placeholder="e.g. Flap plate bent"
                        disabled={creatingSub}
                      />
                    </Field>
                    <Field label="Severity" required>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        disabled={creatingSub}
                      >
                        <option>Critical</option>
                        <option>Major</option>
                        <option>Minor</option>
                      </select>
                    </Field>
                  </div>
                  <div className="row" style={{ marginTop: 12 }}>
                    <Button type="submit" size="sm" variant="primary" disabled={creatingSub || !category}>
                      {creatingSub ? 'Creating…' : 'Save sub-category'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingSub}
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
            ) : null}

            <div className="panel-body flush">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sub-category</th>
                      <th>Severity</th>
                      <th className="num col-tickets">Tickets (90d)</th>
                      <th className="act">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <SkeletonTable rows={5} cols={4} /> : null}
                    {!loading && !filteredSubs.length ? (
                      <tr>
                        <td colSpan={4}>
                          <span className="muted">
                            {query.trim()
                              ? 'No sub-categories match this search.'
                              : 'No sub-categories in this category.'}
                          </span>
                        </td>
                      </tr>
                    ) : null}
                    {!loading
                      ? filteredSubs.map((s) => {
                          const n = s.usage90d || 0
                          return (
                            <tr key={s.id}>
                              <td>{s.name}</td>
                              <td>
                                <SeverityPill severity={s.severity} />
                              </td>
                              <td className="num col-tickets">
                                {n ? (
                                  <Link to="/tickets">{n}</Link>
                                ) : (
                                  <span className="muted">—</span>
                                )}
                              </td>
                              <td className="act">
                                {canEditSub || canDelete ? (
                                  <div className="act-row">
                                    {canEditSub ? (
                                      <Button
                                        size="sm"
                                        className="btn-icon"
                                        title="Edit"
                                        aria-label={`Edit ${s.name}`}
                                        disabled={busyAction || savingEdit}
                                        onClick={() => openEditSub(s)}
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
                                        aria-label={`Delete ${s.name}`}
                                        disabled={busyAction}
                                        onClick={() =>
                                          setConfirmSub({
                                            id: s.id,
                                            name: s.name,
                                            usage90d: n,
                                            categoryName: category?.name || '',
                                          })
                                        }
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
                          )
                        })
                      : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="foot-note">
              Critical faults take the device to <em>Not working</em> on the dashboard. Minor faults
              leave it counted as working. Technicians and engineers can edit sub-categories; delete
              needs Issue master delete permission.
            </div>
          </section>
        </div>
      </main>

      <Modal
        open={Boolean(editSub)}
        title="Edit sub-category"
        subtitle={category?.name ? `In ${category.name}` : 'Name and severity on tickets'}
        closeDisabled={savingEdit}
        onClose={() => {
          if (savingEdit) return
          setEditSub(null)
        }}
      >
        <form onSubmit={saveEditSub}>
          <div className="form-grid">
            <Field label="Sub-category name" required>
              <input
                type="text"
                value={editSubName}
                onChange={(e) => setEditSubName(e.target.value)}
                disabled={savingEdit}
              />
            </Field>
            <Field label="Severity" required>
              <select
                value={editSubSeverity}
                onChange={(e) => setEditSubSeverity(e.target.value)}
                disabled={savingEdit}
              >
                <option>Critical</option>
                <option>Major</option>
                <option>Minor</option>
              </select>
            </Field>
            <Field label="Status">
              <div className="status-switch">
                <button
                  type="button"
                  className={`status-switch-track${editSubActive ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={editSubActive}
                  aria-label={editSubActive ? 'Active' : 'Inactive'}
                  disabled={savingEdit}
                  onClick={() => setEditSubActive((v) => !v)}
                >
                  <span className="status-switch-knob" />
                </button>
                <span className="status-switch-label">
                  {editSubActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Field>
          </div>
          <div className="modal-actions">
            <Button type="submit" variant="primary" disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              disabled={savingEdit}
              onClick={() => setEditSub(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmSub)}
        title="Delete sub-category?"
        subtitle="Unused subs are removed. Subs used on tickets are deactivated instead."
        closeDisabled={busyAction}
        onClose={() => {
          if (busyAction) return
          setConfirmSub(null)
        }}
      >
        <p className="muted" style={{ marginBottom: 16 }}>
          Delete <b>{confirmSub?.name}</b>
          {confirmSub?.categoryName ? ` in ${confirmSub.categoryName}` : ''}?
          {(confirmSub?.usage90d || 0) > 0
            ? ` Seen on ${confirmSub.usage90d} ticket${confirmSub.usage90d === 1 ? '' : 's'} in 90 days.`
            : ''}
        </p>
        <div className="modal-actions">
          <Button type="button" disabled={busyAction} onClick={() => setConfirmSub(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busyAction}
            onClick={confirmRemoveSub}
          >
            {busyAction ? 'Working…' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmCat)}
        title="Delete category?"
        subtitle="Unused categories are removed with their subs. Categories used on tickets are deactivated instead when allowed."
        closeDisabled={busyAction}
        onClose={() => {
          if (busyAction) return
          setConfirmCat(null)
        }}
      >
        <p className="muted" style={{ marginBottom: 16 }}>
          Delete category <b>{confirmCat?.name}</b>
          {confirmCat?.subs?.length
            ? ` (${confirmCat.subs.length} sub-categor${confirmCat.subs.length === 1 ? 'y' : 'ies'})`
            : ''}
          ?
        </p>
        <div className="modal-actions">
          <Button type="button" disabled={busyAction} onClick={() => setConfirmCat(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={busyAction}
            onClick={confirmDeleteCategory}
          >
            {busyAction ? 'Working…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
