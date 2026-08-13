// Basic service worker for PWA caching
const CACHE_NAME = 'wavecore-v1'
const STATIC_ASSETS = [
  '/wavecore-erp',
  '/images/Wavecore.jpeg',
]

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})

self.addEventListener('fetch', (event: any) => {
  // Only cache GET requests for static assets
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        // Don't cache API responses or dynamic data
        if (event.request.url.includes('/api/')) {
          return response
        }

        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() || {}
  const title = data.title || 'WaveCore ERP'
  const options = {
    body: data.body || 'New notification',
    icon: '/images/Wavecore.jpeg',
    badge: '/images/Wavecore.jpeg',
  }

  event.waitUntil(
    (self as any).registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  event.waitUntil(
    (self as any).clients.openWindow('/wavecore-erp')
  )
})