'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { logger } from '@/lib/utils/logger';

export function ServiceWorkerRegister() {
  const { isSupported, isRegistered, isUpdateAvailable } = useServiceWorker();

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
    }
  }, [isSupported, isRegistered, isUpdateAvailable]);

  return null; // This component doesn't render anything (update notification is handled by UpdateNotification component)
}





