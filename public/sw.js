/**
 * OpenCitation Service Worker
 * Handles offline caching, background sync, and PWA functionality
 */

const CACHE_NAME = 'opencitation-v1';
const RUNTIME_CACHE = 'opencitation-runtime-v1';
const API_CACHE = 'opencitation-api-v1';

// Assets to cache on install (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/cite',
  '/lists',
  '/projects',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icon.png',
  '/apple-icon.png',
  '/favicon.ico',
  '/offline.html',
];

// API routes that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/lookup/url',
  '/api/lookup/doi',
  '/api/lookup/isbn',
];

// Routes that should always be network-first
const NETWORK_FIRST_ROUTES = [
  '/api/lists',
  '/api/projects',
  '/api/share',
  '/api/stats',
];

// Install event - precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('opencitation-') &&
                name !== CACHE_NAME &&
                name !== RUNTIME_CACHE &&
                name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip Clerk auth requests
  if (url.hostname.includes('clerk.') || url.pathname.includes('clerk')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets with cache-first
  event.respondWith(handleStaticAssetRequest(request));
});

// Navigation requests - network first with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Last resort - return a basic offline response
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>OpenCitation is not available offline. Please check your connection.</p></body></html>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// API requests - different strategies based on route
async function handleApiRequest(request, url) {
  const isLookupApi = CACHEABLE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );
  const isNetworkFirst = NETWORK_FIRST_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isLookupApi) {
    // Cache-first for lookup APIs (data doesn't change often)
    return handleCacheFirstRequest(request, API_CACHE);
  }

  if (isNetworkFirst) {
    // Network-first for user data APIs
    return handleNetworkFirstRequest(request, API_CACHE);
  }

  // Default to network-only for other APIs
  return fetch(request);
}

// Cache-first strategy
async function handleCacheFirstRequest(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, response);
          });
        }
      })
      .catch(() => {});

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Offline - data not cached' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Network-first strategy
async function handleNetworkFirstRequest(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({ error: 'Offline - please try again when connected' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Static asset requests - cache-first with network fallback
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return a placeholder for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/><text x="50" y="50" text-anchor="middle" fill="#666">Offline</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' },
        }
      );
    }

    return new Response('', { status: 404 });
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-citations') {
    event.waitUntil(syncCitations());
  }
});

async function syncCitations() {
  // Notify clients to trigger sync
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_TRIGGERED',
      timestamp: new Date().toISOString(),
    });
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        Promise.all([
          caches.delete(CACHE_NAME),
          caches.delete(RUNTIME_CACHE),
          caches.delete(API_CACHE),
        ]).then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then((size) => {
          event.ports[0]?.postMessage({ size });
        })
      );
      break;

    case 'PRECACHE_PAGE':
      if (payload?.url) {
        event.waitUntil(
          caches.open(RUNTIME_CACHE).then((cache) => {
            return cache.add(payload.url);
          })
        );
      }
      break;

    default:
      break;
  }
});

// Calculate total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    if (!name.startsWith('opencitation-')) continue;

    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New update from OpenCitation',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'OpenCitation',
      options
    )
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

console.log('[SW] Service Worker loaded');
