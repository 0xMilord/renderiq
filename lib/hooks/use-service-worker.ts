'use client';

import { useState, useEffect, useCallback } from 'react';
import { Workbox } from 'workbox-window';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    setIsSupported(true);

    // Create Workbox instance
    const workbox = new Workbox('/sw.js', {
      type: 'classic',
    });

    setWb(workbox);

    // Register service worker with better error handling
    workbox
      .register()
      .then((registration) => {
        setIsRegistered(true);
        console.log('[SW] Service Worker registered:', registration);
      })
      .catch((error) => {
        // Only log actual errors, not expected failures (e.g., CORS, HTTPS required)
        const errorMessage = error?.message || String(error);
        const isExpectedError = 
          errorMessage.includes('HTTPS') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('network') ||
          errorMessage.includes('Failed to register');
        
        if (!isExpectedError) {
          console.error('[SW] Service Worker registration failed:', error);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn('[SW] Service Worker registration skipped:', errorMessage);
        }
      });

    // Listen for waiting event (update available)
    workbox.addEventListener('waiting', () => {
      setIsUpdateAvailable(true);
      console.log('[SW] Update available - waiting for user confirmation');
    });

    // Listen for controlling event (update activated)
    workbox.addEventListener('controlling', () => {
      console.log('[SW] New service worker controlling pages');
      // Reload page to use new service worker
      window.location.reload();
    });

    // Listen for installed event
    workbox.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        setIsUpdateAvailable(true);
        console.log('[SW] Service Worker updated');
      } else {
        console.log('[SW] Service Worker installed for the first time');
      }
    });

    // Listen for activated event
    workbox.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        console.log('[SW] Service Worker activated (update)');
      } else {
        console.log('[SW] Service Worker activated (first time)');
      }
    });

    // Note: 'externalwaiting' is not a standard Workbox event
    // Workbox handles updates through 'waiting' and 'installed' events
    // Removed to fix TypeScript error

    // Listen for message event from service worker
    workbox.addEventListener('message', (event) => {
      if (event.data?.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
      }
    });

    // Check for updates on window focus
    const handleFocus = () => {
      workbox.update();
    };

    window.addEventListener('focus', handleFocus);

    // Check for updates periodically (every 1 hour)
    const updateInterval = setInterval(() => {
      workbox.update();
    }, 60 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(updateInterval);
    };
  }, []);

  const updateServiceWorker = useCallback(async () => {
    if (!wb) {
      console.warn('[SW] Workbox instance not available');
      return;
    }

    try {
      // Send skip waiting message to service worker
      wb.messageSkipWaiting();
      
      // Wait a bit for the message to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // The controlling event will trigger a reload
      setIsUpdateAvailable(false);
    } catch (error) {
      console.error('[SW] Failed to update service worker:', error);
    }
  }, [wb]);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    updateServiceWorker,
    workbox: wb,
  };
}
