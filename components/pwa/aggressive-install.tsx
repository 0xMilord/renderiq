'use client';

import { useEffect } from 'react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { toast } from 'sonner';

interface AggressiveInstallProps {
  delay?: number; // Delay in milliseconds before auto-prompting
  showToast?: boolean; // Whether to show toast notifications
}

export function AggressiveInstall({ 
  delay = 5000, // 5 seconds default
  showToast = true 
}: AggressiveInstallProps) {
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    // Don't auto-install if already installed or can't install
    if (isInstalled || !canInstall) return;

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check if user has seen the app before (not first visit)
    const hasVisited = localStorage.getItem('pwa-has-visited');
    if (!hasVisited) {
      localStorage.setItem('pwa-has-visited', 'true');
      return; // Don't auto-prompt on first visit
    }

    // Auto-prompt after delay
    const timer = setTimeout(async () => {
      try {
        if (showToast) {
          toast.info('Installing wentire thinng...', {
            description: 'Get the full app experience',
            action: {
              label: 'Install Now',
              onClick: async () => {
                const success = await install();
                if (success) {
                  toast.success('wentire thinng is installing...');
                } else {
                  toast.info('Installation cancelled');
                }
              }
            }
          });
        }

        // Auto-trigger the system install prompt
        const success = await install();
        if (success && showToast) {
          toast.success('wentire thinng is installing...');
        }
      } catch (error) {
        console.error('Auto-install error:', error);
        if (showToast) {
          toast.error('Failed to install app');
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, install, delay, showToast]);

  // This component doesn't render anything
  return null;
}
