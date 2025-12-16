'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

/**
 * Hook to handle PWA app shortcuts
 * Listens for shortcut clicks and navigates accordingly
 */
export function useAppShortcuts() {
  const router = useRouter();

  useEffect(() => {
    // Handle app shortcuts (when app is launched via shortcut)
    const handleShortcut = (event: Event) => {
      const customEvent = event as CustomEvent;
      const shortcut = customEvent.detail?.shortcut;

      logger.log('⚡ App shortcut clicked:', shortcut);

      switch (shortcut) {
        case 'render':
        case 'new-render':
          router.push('/render');
          break;
        case 'gallery':
          router.push('/gallery');
          break;
        case 'dashboard':
          router.push('/dashboard');
          break;
        default:
          logger.warn('⚠️ Unknown shortcut:', shortcut);
      }
    };

    // Listen for shortcut events
    window.addEventListener('app-shortcut', handleShortcut);

    // Check URL for shortcut parameter (fallback)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shortcut = urlParams.get('shortcut');
      
      if (shortcut) {
        handleShortcut(new CustomEvent('app-shortcut', { detail: { shortcut } }));
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    return () => {
      window.removeEventListener('app-shortcut', handleShortcut);
    };
  }, [router]);
}












