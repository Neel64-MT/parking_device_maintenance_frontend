/* Context modules export hooks alongside providers — expected pattern. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ApiRequestError, clearToken, getToken } from '../services/api'
import * as authApi from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!getToken())

  useEffect(() => {
    let cancelled = false
    const token = getToken()
    if (!token) {
      return undefined
    }

    ;(async () => {
      try {
        const next = await authApi.me()
        if (!cancelled) setUser(next)
      } catch (err) {
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
          clearToken()
        }
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const next = await authApi.me()
      setUser(next)
      return next
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
        clearToken()
      }
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (identifier, password) => {
    const data = await authApi.login(identifier, password)
    setUser(data.user)
    setLoading(false)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Protect app routes — redirect to login when there is no session. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-boot" role="status">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

/** Keep logged-in users off login/signup. */
export function GuestOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-boot" role="status">
        Loading…
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
