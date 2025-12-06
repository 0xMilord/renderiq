/**
 * PWA Utilities
 * Production-grade PWA helper functions
 */

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type OS = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Detect user's operating system
 */
export function detectOS(): OS {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/win/.test(platform)) return 'windows';
  if (/mac/.test(platform)) return 'macos';
  if (/linux/.test(platform)) return 'linux';
  
  return 'unknown';
}

/**
 * Detect if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const os = detectOS();
  return os === 'android' || os === 'ios';
}

/**
 * Detect if running on iOS
 */
export function isIOS(): boolean {
  return detectOS() === 'ios';
}

/**
 * Detect if running on Android
 */
export function isAndroid(): boolean {
  return detectOS() === 'android';
}

/**
 * Detect if running on Windows
 */
export function isWindows(): boolean {
  return detectOS() === 'windows';
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running in fullscreen mode
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
}

/**
 * Check if browser supports PWA installation
 */
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for beforeinstallprompt event support
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
}

/**
 * Get install instructions based on OS
 */
export function getInstallInstructions(os: OS): string {
  switch (os) {
    case 'android':
      return 'Tap the menu (⋮) in your browser, then select "Add to Home screen" or "Install app"';
    case 'ios':
      return 'Tap the Share button (□↑) at the bottom, then scroll down and tap "Add to Home Screen"';
    case 'windows':
      return 'Click the install icon (⊕) in your browser\'s address bar, or use the browser menu';
    case 'macos':
      return 'Click the Share button in Safari, then select "Add to Home Screen"';
    default:
      return 'Use your browser\'s menu to install this app';
  }
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any);
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Register online/offline listeners
 */
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get PWA display mode
 */
export function getDisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
  if (typeof window === 'undefined') return 'browser';
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  
  return 'browser';
}




