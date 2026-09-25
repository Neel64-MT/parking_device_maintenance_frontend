import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiRequestError } from '../services/api'
import * as notificationApi from '../services/notifications'
import { canReceiveTicketNotifications } from '../services/users'

const POLL_INTERVAL_MS = 30_000
const SOUND_DEBOUNCE_MS = 2_000
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
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/tickets/')) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userId = user?.id || null
  const eligible = canReceiveTicketNotifications(user)

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [listLoaded, setListLoaded] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [permission, setPermission] = useState(readPermission)
  const [pushConfig, setPushConfig] = useState(null)
  const [pushState, setPushState] = useState(() => (pushSupported() ? 'idle' : 'unsupported'))
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')

  const itemsRef = useRef(items)
  const listLoadedRef = useRef(listLoaded)
  const registrationRef = useRef(null)
  const clickedRef = useRef(new Set())
  const countRequestRef = useRef(0)
  const listRequestRef = useRef(0)
  const listLoadingRef = useRef(false)
  const soundRef = useRef(null)
  const lastSoundAtRef = useRef(0)
  const countInitializedRef = useRef(false)
  const unreadCountRef = useRef(0)
  const mountedRef = useRef(true)

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

  const playNotificationSound = useCallback(() => {
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
      if (mountedRef.current) setUnreadCount(0)
      return 0
    }
    try {
      const count = await notificationApi.getUnreadNotificationCount()
      if (mountedRef.current && requestId === countRequestRef.current) {
        const previousCount = unreadCountRef.current
        const hadPreviousCount = countInitializedRef.current
        unreadCountRef.current = count
        countInitializedRef.current = true
        setUnreadCount(count)
        if (hadPreviousCount && count > previousCount) playNotificationSound()
      }
      return count
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        unreadCountRef.current = 0
        countInitializedRef.current = true
        if (mountedRef.current) setUnreadCount(0)
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

  const reconcileExistingSubscription = useCallback(
    async (config) => {
      if (!eligible || !config?.available || readPermission() !== 'granted') return
      setPushBusy(true)
      try {
        const registration = await getRegistration()
        const subscription = await registration?.pushManager?.getSubscription()
        if (!subscription) {
          if (mountedRef.current) setPushState('idle')
          return
        }
        const saved = await notificationApi.registerPushSubscription(subscription)
        writeSubscriptionId(userId, saved?.id)
        if (mountedRef.current) {
          setPushState('enabled')
          setPushError('')
        }
      } catch (error) {
        if (mountedRef.current) {
          setPushState(error?.code === 'PUSH_SUBSCRIPTION_OWNED' ? 'conflict' : 'error')
          setPushError(errorMessage(error, 'Could not register browser notifications.'))
        }
      } finally {
        if (mountedRef.current) setPushBusy(false)
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
      if (path) navigate(path, { state: { from: '/tickets?tab=new' } })
    },
    [markReadById, navigate],
  )

  const handleServiceWorkerClick = useCallback(
    async (data) => {
      if (!rememberClick(clickedRef, data?.notificationId)) return
      await markReadById(data?.notificationId)
      const path = notificationPath(data)
      if (path) navigate(path, { state: { from: '/tickets?tab=new' } })
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

  const enablePush = useCallback(async () => {
    if (!eligible || !pushSupported()) {
      if (mountedRef.current) setPushState('unsupported')
      return false
    }

    setPushBusy(true)
    setPushError('')
    try {
      // This is intentionally called only from the explicit Enable action.
      const config = pushConfig || (await fetchPushConfig())
      if (!config?.available || !config.publicKey) {
        if (mountedRef.current) setPushState('unavailable')
        return false
      }

      let currentPermission = readPermission()
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission()
        if (mountedRef.current) setPermission(currentPermission)
      }
      if (currentPermission !== 'granted') {
        if (mountedRef.current) setPushState(currentPermission === 'denied' ? 'denied' : 'idle')
        return false
      }

      const registration = await getRegistration()
      if (!registration) return false
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
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
      }
      return true
    } catch (error) {
      if (mountedRef.current) {
        setPushState(error?.code === 'PUSH_SUBSCRIPTION_OWNED' ? 'conflict' : 'error')
        setPushError(errorMessage(error, 'Could not enable browser notifications.'))
      }
      return false
    } finally {
      if (mountedRef.current) setPushBusy(false)
    }
  }, [eligible, fetchPushConfig, getRegistration, pushConfig, userId])

  const disablePush = useCallback(async () => {
    if (!userId) return false
    setPushBusy(true)
    setPushError('')
    const storedId = readSubscriptionId(userId)
    try {
      let registration = registrationRef.current
      if (!registration && pushSupported()) {
        registration = await navigator.serviceWorker.getRegistration()
      }
      const subscription = await registration?.pushManager?.getSubscription()
      if (subscription) await subscription.unsubscribe()
      if (storedId) await notificationApi.removePushSubscription(storedId)
      writeSubscriptionId(userId, null)
      if (mountedRef.current) setPushState(readPermission() === 'granted' ? 'off' : 'idle')
      return true
    } catch (error) {
      // Always clear the local browser subscription even if the API cleanup fails.
      writeSubscriptionId(userId, null)
      if (mountedRef.current) {
        setPushState('error')
        setPushError(errorMessage(error, 'Could not fully turn off browser notifications.'))
      }
      return false
    } finally {
      if (mountedRef.current) setPushBusy(false)
    }
  }, [userId])

  const prepareLogout = useCallback(async () => {
    if (!userId) return
    const storedId = readSubscriptionId(userId)
    try {
      let registration = registrationRef.current
      if (!registration && pushSupported()) registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager?.getSubscription()
      if (subscription) await subscription.unsubscribe()
    } catch {
      /* Continue to remove the server record and local pointer. */
    }
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
      if (config?.available && readPermission() === 'granted') {
        await reconcileExistingSubscription(config)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eligible, fetchPushConfig, getRegistration, reconcileExistingSubscription, refreshUnreadCount, resetState])

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

  return {
    eligible,
    items,
    pagination,
    unreadCount,
    listLoaded,
    listLoading,
    listError,
    permission,
    pushConfig,
    pushState,
    pushBusy,
    pushError,
    refreshNotifications,
    loadNotifications,
    openNotification,
    markAllRead,
    enablePush,
    disablePush,
    prepareLogout,
  }
}
