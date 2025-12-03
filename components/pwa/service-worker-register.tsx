'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { logger } from '@/lib/utils/logger';

export function ServiceWorkerRegister() {
  const { isSupported, isRegistered, isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (!isSupported) {
      logger.warn('⚠️ Service Worker not supported');
      return;
    }

    if (isRegistered) {
      logger.log('✅ Service Worker registered');
    }

    if (isUpdateAvailable) {
      logger.log('🔄 Service Worker update available');
      // Optionally show update notification to user
    }
  }, [isSupported, isRegistered, isUpdateAvailable]);

  // Auto-update on focus (optional)
  useEffect(() => {
    if (!isSupported) return;

    const handleFocus = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isSupported]);

  return null; // This component doesn't render anything
}



