/**
 * App Shell Utilities
 * Manage app shell caching and loading
 */

/**
 * Check if app shell is cached
 */
export async function isAppShellCached(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open('app-shell-v1');
    const keys = await cache.keys();
    return keys.length > 0;
  } catch (error) {
    console.error('Failed to check app shell cache:', error);
    return false;
  }
}

/**
 * Preload app shell assets
 */
export async function preloadAppShell(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // App shell is automatically cached by service worker
    // This function can be used for additional preloading if needed
    console.log('[App Shell] App shell preloaded');
  } catch (error) {
    console.error('[App Shell] Failed to preload app shell:', error);
  }
}

