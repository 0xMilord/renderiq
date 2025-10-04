const CACHE_NAME = 'wentire-thinng-v1.0.0';
const STATIC_CACHE = 'wentire-static-v1.0.0';
const DYNAMIC_CACHE = 'wentire-dynamic-v1.0.0';
const API_CACHE = 'wentire-api-v1.0.0';
const IMAGE_CACHE = 'wentire-images-v1.0.0';

// Cache size limits
const STATIC_CACHE_LIMIT = 50; // 50 items
const DYNAMIC_CACHE_LIMIT = 100; // 100 items
const API_CACHE_LIMIT = 200; // 200 items
const IMAGE_CACHE_LIMIT = 50; // 50 items

// Cache duration (in milliseconds)
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000, // 1 day
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo.png',
  '/og-image.png',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API routes that should be cached
const API_ROUTES = [
  '/api/gallery',
  '/api/projects',
  '/api/renders',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS.filter(url => url !== '/_next/static/css/' && url !== '/_next/static/js/'));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isPageRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-renders':
      event.waitUntil(syncRenders());
      break;
    case 'sync-projects':
      event.waitUntil(syncProjects());
      break;
    case 'sync-gallery-actions':
      event.waitUntil(syncGalleryActions());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('wentire thinng', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime && Date.now() - parseInt(cacheTime) < getCacheDuration(cacheName)) {
        return cachedResponse;
      }
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      await cache.put(request, responseToCache);
      await cleanupCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed, trying cache:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      await cache.put(request, responseToCache);
      await cleanupCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.ttf') ||
         url.pathname === '/manifest.json';
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
         url.pathname.startsWith('/api/renders/') ||
         url.pathname.startsWith('/api/gallery/');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') && !isImageRequest(request);
}

function isPageRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function getCacheDuration(cacheName) {
  switch (cacheName) {
    case STATIC_CACHE:
      return CACHE_DURATION.STATIC;
    case DYNAMIC_CACHE:
      return CACHE_DURATION.DYNAMIC;
    case API_CACHE:
      return CACHE_DURATION.API;
    case IMAGE_CACHE:
      return CACHE_DURATION.IMAGES;
    default:
      return CACHE_DURATION.DYNAMIC;
  }
}

async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const limit = getCacheLimit(cacheName);
  
  if (keys.length > limit) {
    // Remove oldest entries (simple LRU)
    const entriesToDelete = keys.slice(0, keys.length - limit);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

function getCacheLimit(cacheName) {
  switch (cacheName) {
    case STATIC_CACHE:
      return STATIC_CACHE_LIMIT;
    case DYNAMIC_CACHE:
      return DYNAMIC_CACHE_LIMIT;
    case API_CACHE:
      return API_CACHE_LIMIT;
    case IMAGE_CACHE:
      return IMAGE_CACHE_LIMIT;
    default:
      return DYNAMIC_CACHE_LIMIT;
  }
}

// Background sync functions
async function syncRenders() {
  try {
    // Get pending renders from IndexedDB
    const pendingRenders = await getPendingRenders();
    
    for (const render of pendingRenders) {
      try {
        const response = await fetch('/api/renders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(render)
        });
        
        if (response.ok) {
          await removePendingRender(render.id);
        }
      } catch (error) {
        console.log('Failed to sync render:', error);
      }
    }
  } catch (error) {
    console.log('Sync renders failed:', error);
  }
}

async function syncProjects() {
  try {
    const pendingProjects = await getPendingProjects();
    
    for (const project of pendingProjects) {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(project)
        });
        
        if (response.ok) {
          await removePendingProject(project.id);
        }
      } catch (error) {
        console.log('Failed to sync project:', error);
      }
    }
  } catch (error) {
    console.log('Sync projects failed:', error);
  }
}

async function syncGalleryActions() {
  try {
    const pendingActions = await getPendingGalleryActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removePendingGalleryAction(action.id);
        }
      } catch (error) {
        console.log('Failed to sync gallery action:', error);
      }
    }
  } catch (error) {
    console.log('Sync gallery actions failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingRenders() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['renders'], 'readonly');
      const store = transaction.objectStore('renders');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('renders')) {
        db.createObjectStore('renders', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingRender(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['renders'], 'readwrite');
      const store = transaction.objectStore('renders');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function getPendingProjects() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removePendingProject(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function getPendingGalleryActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['galleryActions'], 'readonly');
      const store = transaction.objectStore('galleryActions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removePendingGalleryAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['galleryActions'], 'readwrite');
      const store = transaction.objectStore('galleryActions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
