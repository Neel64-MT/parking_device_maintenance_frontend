/* Context modules export hooks alongside providers — expected pattern. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

const PageMetaContext = createContext(null)

const DEFAULT_META = {
  pageId: '',
  title: '',
  crumb: null,
  actions: null,
}

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(DEFAULT_META)

  const setPageMeta = useCallback((next) => {
    setMeta(next)
  }, [])

  const resetPageMeta = useCallback(() => {
    setMeta(DEFAULT_META)
  }, [])

  const value = useMemo(
    () => ({
      ...meta,
      setPageMeta,
      resetPageMeta,
    }),
    [meta, setPageMeta, resetPageMeta],
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
  const { setPageMeta } = usePageMeta()

  useLayoutEffect(() => {
    setPageMeta({ pageId, title, crumb, actions })
  }, [pageId, title, crumb, actions, setPageMeta])

  return null
}
