self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function readPushPayload(data) {
  if (!data) return {}
  try {
    return data.json() || {}
  } catch {
    try {
      return JSON.parse(data.text()) || {}
    } catch {
      return {}
    }
  }
}

function sameOriginUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, self.location.origin)
    if (url.origin !== self.location.origin || !url.pathname.startsWith('/tickets/')) return null
    return url
  } catch {
    return null
  }
}

function isApplicationClient(client) {
  try {
    const pathname = new URL(client.url).pathname
    return (
      pathname === '/tickets' ||
      pathname.startsWith('/tickets/') ||
      pathname === '/dashboard' ||
      pathname.startsWith('/devices') ||
      pathname.startsWith('/masters') ||
      pathname === '/users' ||
      pathname === '/settings'
    )
  } catch {
    return false
  }
}

function notifyClients(data) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'TICKET_NOTIFICATION_PUSH', data }))
    })
}

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event.data)
  const notification = payload.notification || {}
  const data = {
    ...(payload.data || {}),
    url: payload.data?.url ?? notification.data?.url ?? null,
  }
  const title = notification.title || 'New ticket raised'
  const options = {
    body: notification.body || '',
    tag: notification.tag || (data.notificationId ? `notification.${data.notificationId}` : undefined),
    silent: false,
    requireInteraction: true,
    data,
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options).catch(() => undefined),
      notifyClients(data),
    ]),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const target = sameOriginUrl(data.url)
  const message = {
    type: 'TICKET_NOTIFICATION_CLICK',
    data: {
      notificationId: data.notificationId || null,
      url: target ? `${target.pathname}${target.search}${target.hash}` : null,
    },
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => 'focus' in client && isApplicationClient(client))
      if (existing) {
        try {
          await existing.focus()
          existing.postMessage(message)
          return
        } catch {
          /* Fall through and open a new client if the existing one is stale. */
        }
      }

      if (!target) return
      if (data.notificationId) target.searchParams.set('notificationId', data.notificationId)
      await self.clients.openWindow(`${target.pathname}${target.search}${target.hash}`)
    }),
  )
})
