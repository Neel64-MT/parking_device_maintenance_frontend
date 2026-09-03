/* Context modules export hooks alongside providers — expected pattern. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const PageMetaContext = createContext(null)

const DEFAULT_META = {
  pageId: '',
  title: '',
  crumb: null,
  actions: null,
}

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(DEFAULT_META)

  const value = useMemo(
    () => ({
      ...meta,
      setPageMeta: setMeta,
      resetPageMeta: () => setMeta(DEFAULT_META),
    }),
    [meta],
  )

  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>
}

export function usePageMeta() {
  const ctx = useContext(PageMetaContext)
  if (!ctx) throw new Error('usePageMeta must be used within PageMetaProvider')
  return ctx
}

/**
 * Declare page chrome for the current route (data-page / data-title / topbar-actions).
 * Place once at the top of each page component.
 */
export function PageMeta({ pageId, title, crumb = null, actions = null }) {
  const { setPageMeta, resetPageMeta } = usePageMeta()

  useEffect(() => {
    setPageMeta({ pageId, title, crumb, actions })
    return () => resetPageMeta()
  }, [pageId, title, crumb, actions, setPageMeta, resetPageMeta])

  return null
}
