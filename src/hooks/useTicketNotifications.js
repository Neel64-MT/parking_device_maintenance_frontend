import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiRequestError } from '../services/api'
import * as notificationApi from '../services/notifications'
import { canReceiveTicketNotifications } from '../services/users'

const POLL_INTERVAL_MS = 30_000
const SOUND_DEBOUNCE_MS = 2_000
const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000
const SUBSCRIPTION_KEY_PREFIX = 'pdm_push_subscription:'
const NOTIFICATION_SOUND_URL = '/sounds/elevenlabs-achievement-unlock.mp3'

function readPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/* `serviceWorker.ready` never settles if the worker fails to activate, so bound the wait. */
function waitForActiveWorker() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => {
      window.setTimeout(
        () => reject(new Error('Browser notifications are unavailable: the service worker did not start.')),
        SERVICE_WORKER_READY_TIMEOUT_MS,
      )
    }),
  ])
}

function subscriptionKey(userId) {
  return userId ? `${SUBSCRIPTION_KEY_PREFIX}${userId}` : null
}

function readSubscriptionId(userId) {
  const key = subscriptionKey(userId)
  if (!key) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSubscriptionId(userId, id) {
  const key = subscriptionKey(userId)
  if (!key) return
  try {
    if (id) window.localStorage.setItem(key, id)
    else window.localStorage.removeItem(key)
  } catch {
    /* Storage is optional; the browser subscription remains usable. */
  }
}

function decodeVapidKey(value) {
  const normalized = String(value || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = window.atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function errorMessage(error, fallback) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'You do not have permission to view notifications.'
  }
  return error?.message || fallback
}

function notificationPath(data) {
  if (!data?.canOpen || typeof data.url !== 'string') return null
  try {
    const url = new URL(data.url, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (!url.pathname.startsWith('/tickets/') && url.pathname !== '/users') return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

function navigationOptions(path) {
  return path.startsWith('/tickets/') ? { state: { from: '/tickets?tab=open' } } : undefined
}

function rememberClick(clicked, id) {
  if (!id || clicked.current.has(id)) return false
  clicked.current.add(id)
  if (clicked.current.size > 50) {
    const oldest = clicked.current.values().next().value
    clicked.current.delete(oldest)
  }
  return true
}

export function useTicketNotifications() {
  const { user, updateNotificationPreferences } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = user?.id || null
  const eligible = canReceiveTicketNotifications(user)
  /* Saved per-user application preferences; independent of browser permission. */
  const pushEnabled = user?.notificationPreferences?.pushNotificationsEnabled !== false
  const soundEnabled = user?.notificationPreferences?.playNotificationSound !== false

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [ticketUnreadCount, setTicketUnreadCount] = useState(0)
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [listLoaded, setListLoaded] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [permission, setPermission] = useState(readPermission)
  const [pushConfig, setPushConfig] = useState(null)
  const [pushState, setPushState] = useState(() => (pushSupported() ? 'idle' : 'unsupported'))
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')
  const [preferencesSaving, setPreferencesSaving] = useState(false)

  const itemsRef = useRef(items)
  const listLoadedRef = useRef(listLoaded)
  const registrationRef = useRef(null)
  const clickedRef = useRef(new Set())
  const lastTicketRef = useRef(null)
  const countRequestRef = useRef(0)
  const listRequestRef = useRef(0)
  const listLoadingRef = useRef(false)
  const soundRef = useRef(null)
  const lastSoundAtRef = useRef(0)
  const countInitializedRef = useRef(false)
  const unreadCountRef = useRef(0)
  const mountedRef = useRef(true)
  const pushEnabledRef = useRef(pushEnabled)
  const soundAllowedRef = useRef(pushEnabled && soundEnabled)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    listLoadedRef.current = listLoaded
  }, [listLoaded])

  useEffect(() => {
    pushEnabledRef.current = pushEnabled
    soundAllowedRef.current = pushEnabled && soundEnabled
  }, [pushEnabled, soundEnabled])

  const playNotificationSound = useCallback(() => {
    if (!soundAllowedRef.current) return
    if (typeof window === 'undefined' || !('Audio' in window)) return
    const now = Date.now()
    if (now - lastSoundAtRef.current < SOUND_DEBOUNCE_MS) return
    lastSoundAtRef.current = now

    try {
      if (!soundRef.current) {
        soundRef.current = new window.Audio(NOTIFICATION_SOUND_URL)
        soundRef.current.preload = 'auto'
      }
      soundRef.current.currentTime = 0
      const playResult = soundRef.current.play()
      if (playResult?.catch) playResult.catch(() => {})
    } catch {
      // Browser autoplay policy may reject playback until the user interacts.
    }
  }, [])

  const resetState = useCallback(() => {
    countRequestRef.current += 1
    listRequestRef.current += 1
    listLoadingRef.current = false
    unreadCountRef.current = 0
    countInitializedRef.current = false
    lastSoundAtRef.current = 0
    if (soundRef.current) {
      soundRef.current.pause()
      soundRef.current.currentTime = 0
    }
    setItems([])
    setPagination(null)
    setUnreadCount(0)
    setTicketUnreadCount(0)
    setPendingApprovalCount(0)
    setListLoaded(false)
    setListLoading(false)
    setListError('')
    setPushConfig(null)
    setPushState(
      !pushSupported() ? 'unsupported' : readPermission() === 'denied' ? 'denied' : 'idle',
    )
    setPushError('')
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    const requestId = ++countRequestRef.current
    if (!eligible) {
      unreadCountRef.current = 0
      countInitializedRef.current = false
      if (mountedRef.current) {
        setUnreadCount(0)
        setTicketUnreadCount(0)
        setPendingApprovalCount(0)
      }
      return 0
    }
    try {
      const counts = await notificationApi.getNotificationCounts()
      const count = counts.count
      if (mountedRef.current && requestId === countRequestRef.current) {
        const previousCount = unreadCountRef.current
        const hadPreviousCount = countInitializedRef.current
        unreadCountRef.current = count
        countInitializedRef.current = true
        setUnreadCount(count)
        setTicketUnreadCount(counts.ticketCount)
        setPendingApprovalCount(counts.pendingApprovalCount)
        if (hadPreviousCount && count > previousCount) playNotificationSound()
      }
      return count
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        unreadCountRef.current = 0
        countInitializedRef.current = true
        if (mountedRef.current) {
          setUnreadCount(0)
          setTicketUnreadCount(0)
          setPendingApprovalCount(0)
        }
      }
      return 0
    }
  }, [eligible, playNotificationSound])

  const loadNotifications = useCallback(async () => {
    if (!eligible || listLoadingRef.current) return
    const requestId = ++listRequestRef.current
    listLoadingRef.current = true
    if (mountedRef.current) {
      setListLoading(true)
      setListError('')
    }
    try {
      const result = await notificationApi.listNotifications({ page: 1, limit: 10 })
      if (!mountedRef.current || requestId !== listRequestRef.current) return
      setItems(result.items)
      setPagination(result.pagination)
      setListLoaded(true)
    } catch (error) {
      if (mountedRef.current && requestId === listRequestRef.current) {
        setListError(errorMessage(error, 'Could not load notifications.'))
      }
    } finally {
      if (requestId === listRequestRef.current) {
        listLoadingRef.current = false
        if (mountedRef.current) setListLoading(false)
      }
    }
  }, [eligible])

  const refreshNotifications = useCallback(async () => {
    await refreshUnreadCount()
    if (listLoadedRef.current) await loadNotifications()
  }, [loadNotifications, refreshUnreadCount])

  const getRegistration = useCallback(async () => {
    if (!pushSupported()) return null
    if (registrationRef.current) return registrationRef.current
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      registrationRef.current = registration
      return registration
    } catch (error) {
      setPushError(errorMessage(error, 'Browser notifications are unavailable in this browser.'))
      setPushState('unsupported')
      return null
    }
  }, [])

  const fetchPushConfig = useCallback(async () => {
    if (!eligible) return null
    try {
      const config = await notificationApi.getPushConfig()
      if (mountedRef.current) {
        setPushConfig(config)
        setPushError('')
        if (!config?.available) setPushState('unavailable')
      }
      return config
    } catch (error) {
      if (mountedRef.current) {
        setPushError(errorMessage(error, 'Could not load browser notification settings.'))
        setPushState('error')
      }
      return null
    }
  }, [eligible])

  /*
   * Register this browser's push subscription for the signed-in user without prompting.
   * Requires permission to already be granted. Reuses the existing browser subscription
   * (the backend upserts by endpoint) and only creates one when `create` is set.
   */
  const ensureSubscription = useCallback(
    async (config, { create }) => {
      if (!eligible || !config?.available || !config.publicKey || readPermission() !== 'granted') {
        return false
      }
      try {
        let registration = await getRegistration()
        if (!registration) return false
        // subscribe() needs an active worker; right after register() it may still be installing.
        if (!registration.active) registration = await waitForActiveWorker()
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          if (!create) {
            if (mountedRef.current) setPushState('idle')
            return false
          }
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidKey(config.publicKey),
          })
        }
        const saved = await notificationApi.registerPushSubscription(subscription)
        writeSubscriptionId(userId, saved?.id)
        if (mountedRef.current) {
          setPushState('enabled')
          setPermission('granted')
          setPushError('')
        }
        return true
      } catch (error) {
        if (mountedRef.current) {
          setPushState(error?.code === 'PUSH_SUBSCRIPTION_OWNED' ? 'conflict' : 'error')
          setPushError(errorMessage(error, 'Could not register browser notifications.'))
        }
        return false
      }
    },
    [eligible, getRegistration, userId],
  )

  const markReadById = useCallback(
    async (notificationId) => {
      if (!notificationId) return false
      const current = itemsRef.current.find((item) => item.id === notificationId)
      try {
        const saved = await notificationApi.markNotificationRead(notificationId)
        if (mountedRef.current) {
          setItems((previous) =>
            previous.map((item) => (item.id === notificationId ? { ...item, ...saved } : item)),
          )
          if (current && !current.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1))
            if (current.relatedEntityType === 'ticket') {
              setTicketUnreadCount((count) => Math.max(0, count - 1))
            }
          }
        }
        void refreshUnreadCount()
        return true
      } catch (error) {
        if (mountedRef.current) setListError(errorMessage(error, 'Could not mark notification as read.'))
        return false
      }
    },
    [refreshUnreadCount],
  )

  const openNotification = useCallback(
    async (notification) => {
      if (!notification) return
      await markReadById(notification.id)
      const path = notificationPath(notification.data)
      if (path) navigate(path, navigationOptions(path))
    },
    [markReadById, navigate],
  )

  const handleServiceWorkerClick = useCallback(
    async (data) => {
      if (!rememberClick(clickedRef, data?.notificationId)) return
      await markReadById(data?.notificationId)
      const path = notificationPath(data)
      if (path) navigate(path, navigationOptions(path))
    },
    [markReadById, navigate],
  )

  const markAllRead = useCallback(async () => {
    if (!eligible) return false
    setPushBusy(true)
    try {
      await notificationApi.markAllNotificationsRead()
      if (mountedRef.current) {
        setItems((previous) => previous.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })))
        setUnreadCount(0)
        setTicketUnreadCount(0)
        setListError('')
      }
      void refreshUnreadCount()
      return true
    } catch (error) {
      if (mountedRef.current) setListError(errorMessage(error, 'Could not mark notifications as read.'))
      return false
    } finally {
      if (mountedRef.current) setPushBusy(false)
    }
  }, [eligible, refreshUnreadCount])

  /*
   * Ask the browser for permission (only while it is still "default") and register this
   * browser. Must be called from a user click: permission is requested before any network
   * await so the click still counts as the user gesture. Never called on load or login.
   */
  const requestBrowserPermission = useCallback(async () => {
    if (!eligible || !pushSupported()) {
      if (mountedRef.current) setPushState('unsupported')
      return false
    }

    setPushBusy(true)
    setPushError('')
    try {
      let currentPermission = readPermission()
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission()
        if (mountedRef.current) setPermission(currentPermission)
      }
      if (currentPermission !== 'granted') {
        if (mountedRef.current) setPushState(currentPermission === 'denied' ? 'denied' : 'idle')
        return false
      }

      const config = pushConfig || (await fetchPushConfig())
      if (!config?.available || !config.publicKey) {
        if (mountedRef.current) setPushState('unavailable')
        return false
      }
      return await ensureSubscription(config, { create: true })
    } catch (error) {
      if (mountedRef.current) {
        setPushState('error')
        setPushError(errorMessage(error, 'Could not enable browser notifications.'))
      }
      return false
    } finally {
      if (mountedRef.current) setPushBusy(false)
    }
  }, [eligible, ensureSubscription, fetchPushConfig, pushConfig])

  /*
   * Application preference (stored per user). Turning it OFF keeps the browser permission
   * and subscription: the backend stops delivery for every device the user has.
   * Throws when the save fails so the caller can show the standard error toast.
   */
  const setPushEnabled = useCallback(
    async (enabled) => {
      if (!eligible) return false
      setPreferencesSaving(true)
      try {
        if (enabled && pushSupported() && readPermission() === 'default') {
          const result = await Notification.requestPermission()
          if (mountedRef.current) setPermission(result)
          if (result === 'denied' && mountedRef.current) setPushState('denied')
        }
        await updateNotificationPreferences({ pushNotificationsEnabled: Boolean(enabled) })
        if (enabled && readPermission() === 'granted') {
          const config = pushConfig || (await fetchPushConfig())
          await ensureSubscription(config, { create: true })
        }
        return true
      } finally {
        if (mountedRef.current) setPreferencesSaving(false)
      }
    },
    [eligible, ensureSubscription, fetchPushConfig, pushConfig, updateNotificationPreferences],
  )

  const setPlaySound = useCallback(
    async (enabled) => {
      if (!eligible) return false
      setPreferencesSaving(true)
      try {
        await updateNotificationPreferences({ playNotificationSound: Boolean(enabled) })
        return true
      } finally {
        if (mountedRef.current) setPreferencesSaving(false)
      }
    },
    [eligible, updateNotificationPreferences],
  )

  /*
   * Logout removes only this browser's server record so a signed-out (or shared) browser
   * receives nothing. The browser subscription and permission are kept, so the next
   * login re-registers silently instead of asking the user to enable push again.
   */
  const prepareLogout = useCallback(async () => {
    if (!userId) return
    const storedId = readSubscriptionId(userId)
    if (storedId) {
      try {
        await notificationApi.removePushSubscription(storedId)
      } catch {
        /* Logout must still complete if the server record is already gone. */
      }
    }
    writeSubscriptionId(userId, null)
  }, [userId])

  /* Auth/eligibility changes reset all server-owned state. */
  useEffect(() => {
    let cancelled = false
    if (!eligible) {
      const resetTimer = window.setTimeout(() => {
        if (!cancelled) resetState()
      }, 0)
      return () => {
        cancelled = true
        window.clearTimeout(resetTimer)
      }
    }

    void (async () => {
      await refreshUnreadCount()
      const config = await fetchPushConfig()
      if (cancelled) return
      await getRegistration()
      if (cancelled) return
      // No prompt here: only an already-granted browser is (re-)registered.
      if (config?.available && readPermission() === 'granted') {
        setPushBusy(true)
        await ensureSubscription(config, { create: pushEnabledRef.current })
        if (mountedRef.current) setPushBusy(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eligible, ensureSubscription, fetchPushConfig, getRegistration, refreshUnreadCount, resetState])

  /* Refresh active-client state without a page reload. Polling is the fallback for clients without push. */
  useEffect(() => {
    if (!eligible) return undefined

    const refresh = () => {
      setPermission(readPermission())
      void refreshNotifications()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [eligible, refreshNotifications])

  /* Service-worker push/click events update the shared in-app state. */
  useEffect(() => {
    if (!eligible || !pushSupported()) return undefined
    const onMessage = (event) => {
      const type = event.data?.type
      if (type === 'TICKET_NOTIFICATION_PUSH') {
        playNotificationSound()
        void refreshNotifications()
      } else if (type === 'TICKET_NOTIFICATION_CLICK') {
        void handleServiceWorkerClick(event.data?.data)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [eligible, handleServiceWorkerClick, playNotificationSound, refreshNotifications])

  /* A notification opened into a new tab carries its ID in the query string. */
  useEffect(() => {
    if (!eligible) return
    const params = new URLSearchParams(location.search)
    const notificationId = params.get('notificationId')
    if (!notificationId || !rememberClick(clickedRef, notificationId)) return
    void markReadById(notificationId)
    params.delete('notificationId')
    const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`
    window.history.replaceState({}, '', next)
  }, [eligible, location.hash, location.pathname, location.search, markReadById])

  /*
   * Opening a ticket marks that ticket's notifications read — including when the
   * user navigates straight to the ticket rather than clicking the bell.
   * Scoped per ticket so re-entering the same one is a no-op, and the backend
   * already restricts the update to the caller's own notifications.
   */
  useEffect(() => {
    if (!eligible) return
    const match = /^\/tickets\/([^/]+)$/.exec(location.pathname)
    const currentTicketId = match ? decodeURIComponent(match[1]) : null
    if (!currentTicketId) {
      lastTicketRef.current = null
      return
    }
    if (lastTicketRef.current === currentTicketId) return
    lastTicketRef.current = currentTicketId

    let cancelled = false
    ;(async () => {
      try {
        const result = await notificationApi.markTicketNotificationsRead(currentTicketId)
        if (cancelled) return
        const updated = Number(result?.updated || 0)
        if (updated <= 0) return
        // Keep the loaded list and the badge in step with what the server just changed.
        setItems((previous) =>
          previous.map((item) =>
            item.relatedEntityType === 'ticket' && item.data?.ticketId === currentTicketId
              ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
              : item,
          ),
        )
        setUnreadCount((count) => Math.max(0, count - updated))
        setTicketUnreadCount((count) => Math.max(0, count - updated))
        void refreshUnreadCount()
      } catch (error) {
        // A read-state sync failure must never block viewing the ticket.
        if (!cancelled && mountedRef.current) {
          setListError(errorMessage(error, 'Could not update notification read state.'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eligible, location.pathname, refreshUnreadCount])

  return {
    eligible,
    items,
    pagination,
    unreadCount,
    ticketUnreadCount,
    pendingApprovalCount,
    listLoaded,
    listLoading,
    listError,
    permission,
    pushConfig,
    pushState,
    pushBusy,
    pushError,
    preferences: {
      pushNotificationsEnabled: pushEnabled,
      playNotificationSound: soundEnabled,
    },
    preferencesSaving,
    refreshNotifications,
    loadNotifications,
    openNotification,
    markAllRead,
    requestBrowserPermission,
    setPushEnabled,
    setPlaySound,
    prepareLogout,
  }
}
