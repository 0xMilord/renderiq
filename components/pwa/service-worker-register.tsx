'use client';

import { useEffect, useState } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { logger } from '@/lib/utils/logger';

export function ServiceWorkerRegister() {
  const { isSupported, isRegistered, isUpdateAvailable } = useServiceWorker();
  const [hasCheckedSupport, setHasCheckedSupport] = useState(false);

  useEffect(() => {
    // Only check support once after mount to avoid false warnings
    if (typeof window === 'undefined') return;
    
    // Check if service worker is actually supported
    const actuallySupported = 'serviceWorker' in navigator;
    
    if (!hasCheckedSupport) {
      setHasCheckedSupport(true);
      
      // Only log warning if we're sure it's not supported (after checking)
      if (!actuallySupported) {
        // Don't log to Sentry - this is expected in some browsers/environments
        if (process.env.NODE_ENV === 'development') {
          logger.warn('⚠️ Service Worker not supported in this browser');
        }
        return;
      }
    }

    // Only log positive status updates, not errors
    if (isSupported && isRegistered) {
      logger.log('✅ Service Worker registered');
    }

    if (isUpdateAvailable) {
      logger.log('🔄 Service Worker update available');
    }
  }, [isSupported, isRegistered, isUpdateAvailable, hasCheckedSupport]);

  return null; // This component doesn't render anything (update notification is handled by UpdateNotification component)
}





