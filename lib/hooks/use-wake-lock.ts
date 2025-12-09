'use client';

import { useState, useEffect, useRef } from 'react';

interface WakeLockSentinel {
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
  removeEventListener: (type: 'release', listener: () => void) => void;
}

export function useWakeLock(enabled: boolean = false) {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setIsSupported('wakeLock' in navigator);
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported) {
      // Release wake lock if disabled
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // Ignore errors
        });
        wakeLockRef.current = null;
        setIsActive(false);
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        setIsActive(true);

        // Handle wake lock release
        const handleRelease = () => {
          setIsActive(false);
          wakeLockRef.current = null;
        };

        wakeLock.addEventListener('release', handleRelease);

        // Handle visibility change (wake lock is released when page becomes hidden)
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden' && wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => {
              // Ignore errors
            });
            wakeLockRef.current = null;
            setIsActive(false);
          } else if (document.visibilityState === 'visible' && enabled) {
            // Re-request wake lock when page becomes visible again
            requestWakeLock();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          wakeLock.removeEventListener('release', handleRelease);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.error('Failed to request wake lock:', error);
        setIsActive(false);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // Ignore errors
        });
        wakeLockRef.current = null;
        setIsActive(false);
      }
    };
  }, [enabled, isSupported]);

  return {
    isSupported,
    isActive,
  };
}

