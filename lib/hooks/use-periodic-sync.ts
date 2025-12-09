'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for Periodic Background Sync
 * Register periodic sync tags for background content updates
 */
export function usePeriodicSync() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Check if Periodic Background Sync is supported
    const checkSupport = async () => {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in (registration as any)) {
        setIsSupported(true);
        
        // Register periodic sync
        try {
          await (registration as any).periodicSync.register('content-sync', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          setIsRegistered(true);
        } catch (error: any) {
          // Permission denied or not supported
          if (error.name !== 'NotAllowedError') {
            console.error('Failed to register periodic sync:', error);
          }
        }
      }
    };

    checkSupport();
  }, []);

  const unregister = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in (registration as any)) {
        await (registration as any).periodicSync.unregister('content-sync');
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Failed to unregister periodic sync:', error);
    }
  };

  return {
    isSupported,
    isRegistered,
    unregister,
  };
}

