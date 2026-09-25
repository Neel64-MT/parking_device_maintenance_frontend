import { api, apiEnvelope } from './api'

const DEFAULT_PAGE_SIZE = 10
const ALLOWED_PAGE_SIZES = new Set([10, 25, 50, 100])

function pageSize(value) {
  const size = Number(value)
  return ALLOWED_PAGE_SIZES.has(size) ? size : DEFAULT_PAGE_SIZE
}

/** List the current user's notifications, retaining backend pagination metadata. */
export async function listNotifications({
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  unreadOnly = false,
} = {}) {
  const params = new URLSearchParams()
  params.set('page', String(Math.max(1, Number(page) || 1)))
  params.set('limit', String(pageSize(limit)))
  params.set('unreadOnly', unreadOnly ? 'true' : 'false')

  const envelope = await apiEnvelope(`/api/notifications?${params}`)
  return {
    items: Array.isArray(envelope?.data) ? envelope.data : [],
    pagination: envelope?.pagination || {
      page: Math.max(1, Number(page) || 1),
      limit: pageSize(limit),
      total: 0,
      totalPages: 1,
    },
  }
}

export async function getUnreadNotificationCount() {
  const data = await api('/api/notifications/unread-count')
  return Number(data?.count) || 0
}

export async function markNotificationRead(notificationId) {
  return api(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  })
}

export async function markAllNotificationsRead() {
  return api('/api/notifications/read-all', { method: 'PATCH' })
}

export async function getPushConfig() {
  return api('/api/notifications/push-config')
}

/** Store a browser PushSubscription using the backend's existing contract. */
export async function registerPushSubscription(subscription) {
  const value = typeof subscription?.toJSON === 'function' ? subscription.toJSON() : subscription
  if (!value?.endpoint || !value?.keys?.p256dh || !value?.keys?.auth) {
    throw new Error('Browser push subscription is incomplete.')
  }

  return api('/api/notifications/push-subscriptions', {
    method: 'PUT',
    body: {
      endpoint: value.endpoint,
      keys: {
        p256dh: value.keys.p256dh,
        auth: value.keys.auth,
      },
    },
  })
}

export async function removePushSubscription(subscriptionId) {
  return api(`/api/notifications/push-subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
  })
}
