'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from './use-pwa-install';
import { trackInstallEvent } from '@/lib/utils/install-analytics';

/**
 * Hook for smart install prompt timing
 * Shows install prompt based on user engagement metrics
 */
export function useSmartInstallPrompt() {
  const { install, isInstallable, isInstalled } = usePWAInstall();
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [dismissedCount, setDismissedCount] = useState(0);

  useEffect(() => {
    if (isInstalled || !isInstallable) {
      setShouldShowPrompt(false);
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedCountValue = dismissed ? parseInt(dismissed, 10) : 0;
    setDismissedCount(dismissedCountValue);

    // Don't show if dismissed 3+ times
    if (dismissedCountValue >= 3) {
      setShouldShowPrompt(false);
      return;
    }

    // Check engagement metrics
    const sessionStart = sessionStorage.getItem('session-start');
    const sessionTime = sessionStart 
      ? Date.now() - parseInt(sessionStart, 10) 
      : 0;
    
    const pageViews = parseInt(sessionStorage.getItem('page-views') || '0', 10);
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10) + 1;
    
    // Update visit count
    localStorage.setItem('pwa-visit-count', visitCount.toString());

    // Set session start if not set
    if (!sessionStart) {
      sessionStorage.setItem('session-start', Date.now().toString());
    }

    // Increment page views
    sessionStorage.setItem('page-views', (pageViews + 1).toString());

    // Show prompt after:
    // - 10 seconds of engagement, OR
    // - 3+ page views, OR
    // - User returns (2nd+ visit)
    const shouldShow = 
      sessionTime > 30000 || 
      pageViews >= 3 || 
      visitCount >= 2;

    setShouldShowPrompt(shouldShow);
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    const newCount = dismissedCount + 1;
    setDismissedCount(newCount);
    localStorage.setItem('pwa-install-dismissed', newCount.toString());
    setShouldShowPrompt(false);
    trackInstallEvent('prompt_dismissed', { dismissed_count: newCount });
  };

  return {
    shouldShowPrompt,
    handleDismiss,
    install,
    isInstallable,
  };
}

