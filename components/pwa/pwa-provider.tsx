'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AutoInstallDialog } from './auto-install-dialog';
import { AggressiveInstall } from './aggressive-install';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: CustomEvent<PWAInstallPrompt>;
  }
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: CustomEvent<PWAInstallPrompt>) => {
      e.preventDefault();
      setDeferredPrompt(e.detail);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('wentire thinng installed successfully!');
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You\'re back online!');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline. Your work will sync when you\'re back online.');
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    registerServiceWorker();

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing wentire thinng...');
      } else {
        toast.info('Installation cancelled');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      } catch (error) {
        console.error('Error updating app:', error);
      }
    }
  };

  // Expose PWA functions globally for easy access
  useEffect(() => {
    (window as any).pwa = {
      install: installApp,
      update: updateApp,
      isInstalled,
      isOnline,
      canInstall: !!deferredPrompt,
    };
  }, [deferredPrompt, isInstalled, isOnline]);

  return (
    <>
      {children}
      <AutoInstallDialog />
      <AggressiveInstall delay={3000} showToast={true} />
    </>
  );
}