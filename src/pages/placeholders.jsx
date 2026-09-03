import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'

function Placeholder({ pageId, title, crumb, label }) {
  return (
    <>
      <PageMeta pageId={pageId} title={title} crumb={crumb} />
      <main className="page">
        <p className="text-[15px] font-semibold text-[var(--ink)]">{label}</p>
        <p className="mt-2 text-[13px] text-[var(--ink-3)]">
          Phase 1 placeholder — full UI lands in a later phase.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => toast('Design preview — shell OK.')}
        >
          Test toast
        </button>
      </main>
    </>
  )
}

export function UsersPage() {
  return (
    <Placeholder
      pageId="users"
      title="Users"
      crumb="Who can see and do what in the system"
      label="Users (Phase 1 placeholder)"
    />
  )
}
