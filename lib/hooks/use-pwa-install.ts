'use client';

import { useState, useEffect } from 'react';
import type { InstallPromptEvent } from '@/lib/utils/pwa';
import { trackInstallEvent } from '@/lib/utils/install-analytics';
import { setupPostInstallExperience } from '@/lib/utils/post-install-setup';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (typeof window === 'undefined') return false;
      
      // Check standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Check iOS standalone
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      
      return false;
    };

    const installed = checkInstalled();
    setIsInstalled(installed);

    // Setup post-install experience if already installed
    if (installed) {
      setupPostInstallExperience();
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
      setIsInstallable(true);
      trackInstallEvent('prompt_shown');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      trackInstallEvent('install_completed');
      setupPostInstallExperience();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      trackInstallEvent('prompt_accepted');
      
      // Show install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        trackInstallEvent('install_completed');
        setupPostInstallExperience();
        return true;
      } else {
        trackInstallEvent('prompt_dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      trackInstallEvent('install_failed', { error: (error as Error).message });
      return false;
    }
  };

  return {
    install,
    isInstallable,
    isInstalled,
    deferredPrompt,
  };
}





