// ══════════════════════════════════════════════════════════
//  sw.ts — Service Worker con soporte Push Notifications
//  Workbox inyecta el manifiesto de precache aquí
// ══════════════════════════════════════════════════════════
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache manifest (inyectado por Workbox en build)
precacheAndRoute(self.__WB_MANIFEST)

// Runtime caching para APIs públicas
registerRoute(
  /^\/api\/productos\/(?:buscar|lista-rapida)/,
  new CacheFirst({
    cacheName: 'api-productos',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 }),
    ],
  }),
)

registerRoute(
  /^\/api\/categorias/,
  new CacheFirst({
    cacheName: 'api-categorias',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
)

registerRoute(
  /^\/api\/sucursales/,
  new CacheFirst({
    cacheName: 'api-sucursales',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
)

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 }),
    ],
  }),
)

// External images
registerRoute(
  /^https:\/\/img\.icons8\.com/,
  new StaleWhileRevalidate({
    cacheName: 'external-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
)

// ── Push Notifications ──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const { title, body, icon, badge, tag, data: payloadData, actions } = data

    const options: NotificationOptions = {
      body: body || '',
      icon: icon || '/icons/icon-192.svg',
      badge: badge || '/icons/icon-192.svg',
      tag: tag || 'default',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      silent: false,
      data: payloadData || {},
      actions: actions || [
        { action: 'open', title: 'Ver' },
        { action: 'close', title: 'Cerrar' },
      ],
    }

    event.waitUntil(
      self.registration.showNotification(title || 'Farmacy', options),
    )
  } catch {
    // Si no es JSON, mostrar como texto plano
    event.waitUntil(
      self.registration.showNotification(event.data.text(), {
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
      }),
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}

  if (action === 'close') return

  // Determinar URL destino
  let url = data.url || '/'

  // Enfocar o abrir ventana
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla y navegar
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            if (url) {
              client.navigate(url)
            }
            return
          }
        }
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          clients.openWindow(url)
        }
      }),
  )
})

self.addEventListener('notificationclose', () => {
  // Opcional: trackear analytics de notificaciones cerradas
})

// ── Skip waiting + claim clients para auto-update ──────────
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// ── Navigation fallback (offline.html) ───────────────────────
// Cuando el usuario navega a una ruta no cacheada sin conexión,
// servimos offline.html en lugar del error de red del navegador.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          const fallback = await caches.match('/offline.html')
          return fallback || new Response('Sin conexión', { status: 503 })
        }),
    )
  }
  // Otros requests (imágenes, API, etc.) los maneja workbox-precaching automáticamente
})
