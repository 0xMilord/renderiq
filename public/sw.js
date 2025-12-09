// Service Worker for Renderiq PWA
// Built with Workbox for production-grade PWA features
// Version: 3.0.0 - Enhanced with streaming, app shell, and SWI patterns
// Note: self.__WB_MANIFEST will be injected by Workbox build process

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.4.0/workbox-sw.js');

// Set Workbox to use CDN
workbox.setConfig({
  debug: false,
});

// Clean up outdated caches
workbox.precaching.cleanupOutdatedCaches();

// App Shell Pattern: Precache critical app shell assets
const APP_SHELL_ASSETS = [
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Precache app shell assets first
caches.open('app-shell-v1').then((cache) => {
  return cache.addAll(APP_SHELL_ASSETS);
}).catch((error) => {
  console.error('[SW] Failed to cache app shell:', error);
});

// Precache all build assets (injected by Workbox build process)
// self.__WB_MANIFEST will be replaced with actual precache manifest at build time
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Background Sync Plugin for API calls
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // 24 hours
});

// API calls - Network First with background sync
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      bgSyncPlugin,
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Images - Stale While Revalidate with broadcast updates and offline fallback
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image' || 
                   /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(request.url),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
      new workbox.broadcastUpdate.BroadcastUpdatePlugin({
        channelName: 'image-updates',
      }),
      {
        // Offline fallback for images
        fetchDidFail: async ({ request }) => {
          // Try to return a placeholder icon from cache
          const placeholder = await caches.match('/icons/icon-512x512.png');
          if (placeholder) {
            return placeholder;
          }
          // If no placeholder, return error (will be caught by catch handler)
          throw new Error('Image fetch failed and no placeholder available');
        },
      },
    ],
  })
);

// Static assets (JS, CSS, fonts, Next.js chunks) - Cache First
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.url.includes('/_next/static/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// HTML pages - Network First with App Shell fallback
// App Shell Pattern: Serve cached shell instantly while fetching content
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true,
      }),
      {
        // App Shell fallback when network fails
        fetchDidFail: async () => {
          // Try app shell (offline page)
          const appShell = await caches.match('/offline');
          if (appShell) {
            return appShell;
          }
          // Fallback response
          return new Response('Offline', { status: 503 });
        },
      },
    ],
  })
);

// CRITICAL: Skip caching external payment gateway scripts (Razorpay, etc.)
// These must load fresh from origin to avoid CSP violations and ensure latest version
workbox.routing.registerRoute(
  ({ url }) => 
    url.hostname.includes('razorpay.com') || 
    url.hostname.includes('checkout.razorpay.com'),
  ({ request }) => fetch(request), // Bypass service worker
  'GET'
);

// Enhanced offline fallbacks
workbox.routing.setCatchHandler(({ request }) => {
  // Navigation requests - return offline page
  if (request.mode === 'navigate') {
    return caches.match('/offline') || new Response('Offline', { status: 503 });
  }
  
  // Image requests - return offline placeholder
  if (request.destination === 'image') {
    return caches.match('/icons/icon-512x512.png').catch(() => 
      new Response('', { status: 503 })
    );
  }
  
  // API requests - return cached response or offline JSON
  if (request.url.includes('/api/')) {
    return caches.match(request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline', message: 'Network unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
  
  return Response.error();
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Renderiq';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.url || '/',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };
  
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open('pages-cache').then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: '2.0.0' });
  }
  
  // CLIENT_CLAIM removed - not needed with Workbox lifecycle management
  // Workbox handles client claiming automatically when appropriate
});

// Global error handlers
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error);
  // Could send to analytics here
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
  // Could send to analytics here
});

// Background Sync event handler (for custom sync tags)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    // BackgroundSyncPlugin handles this automatically
    // This is here for any custom sync logic if needed
    event.waitUntil(syncQueue());
  }
});

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(periodicSync());
  }
});

// Periodic sync function for background content updates
async function periodicSync() {
  try {
    // Sync any pending updates
    await syncQueue();
    
    // Check for service worker updates
    const registration = await self.registration;
    if (registration) {
      await registration.update();
    }
    
    // Notify clients of periodic sync completion
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'PERIODIC_SYNC_COMPLETE',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('[SW] Periodic sync error:', error);
  }
}

// Custom sync queue function (enhanced with retry logic)
async function syncQueue() {
  try {
    const db = await openDB();
    const queue = await getAllFromQueue(db);
    
    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        
        if (response.ok) {
          await removeFromQueue(db, item.id);
          
          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              id: item.id,
            });
          });
        } else {
          // Retry with exponential backoff
          await scheduleRetry(item, db);
        }
      } catch (error) {
        console.error('[SW] Sync failed for:', item.url, error);
        // Retry with exponential backoff
        await scheduleRetry(item, db);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

// Schedule retry with exponential backoff
async function scheduleRetry(item, db) {
  const retryCount = (item.retryCount || 0) + 1;
  const maxRetries = 5;
  
  if (retryCount >= maxRetries) {
    // Remove from queue after max retries
    await removeFromQueue(db, item.id);
    return;
  }
  
  // Update retry count
  item.retryCount = retryCount;
  item.nextRetry = Date.now() + Math.pow(2, retryCount) * 1000; // Exponential backoff
  
  // Update in IndexedDB
  const transaction = db.transaction(['queue'], 'readwrite');
  const store = transaction.objectStore('queue');
  await store.put(item);
}

// IndexedDB helpers for background sync queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('renderiq-sync-queue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: false });
        store.createIndex('nextRetry', 'nextRetry', { unique: false });
      }
    };
  });
}

function getAllFromQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readonly');
    const store = transaction.objectStore('queue');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromQueue(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
