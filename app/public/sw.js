const CACHE_NAME = 'claudepath-v1'
const STATIC_CACHE = 'claudepath-static-v1'

self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()) })

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api/')) return // skip API
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(STATIC_CACHE).then(c => c.put(e.request, clone))
      return res
    })))
    return
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(self.registration.showNotification(data.title || 'ClaudePath', {
    body: data.body || 'Đến giờ ôn tập rồi!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow('/practice'))
})
