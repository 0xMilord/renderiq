/**
 * Window Management Utilities
 * Handle window sizing, positioning, and management for PWA
 */

/**
 * Initialize window size and position on first launch
 */
export function initializeWindowSize(): void {
  if (typeof window === 'undefined') return;

  // Only run in standalone mode (PWA installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (!isStandalone) return;

  // Check if this is first launch
  const hasLaunched = sessionStorage.getItem('pwa-window-initialized');
  if (hasLaunched) return;

  // Check if we're in a browser tab (don't resize browser tabs)
  const isBrowser = window.matchMedia('(display-mode: browser)').matches;
  if (isBrowser) return;

  try {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    // Optimal size: 80% of screen, max 1920x1080
    const width = Math.min(1920, Math.floor(screenWidth * 0.8));
    const height = Math.min(1080, Math.floor(screenHeight * 0.8));

    // Center window on screen
    const left = Math.floor((screenWidth - width) / 2);
    const top = Math.floor((screenHeight - height) / 2);

    // Resize and move window
    window.resizeTo(width, height);
    window.moveTo(left, top);

    // Mark as initialized
    sessionStorage.setItem('pwa-window-initialized', 'true');
  } catch (error) {
    // Window APIs may not be available in all contexts
    console.log('Window management not available:', error);
  }
}

/**
 * Open new window with specified URL and options
 */
export function openNewWindow(
  url: string = '/',
  options?: {
    width?: number;
    height?: number;
    name?: string;
  }
): Window | null {
  if (typeof window === 'undefined') return null;

  const isBrowser = window.matchMedia('(display-mode: browser)').matches;
  if (isBrowser) {
    // In browser, open as new tab
    return window.open(url, '_blank');
  }

  // In PWA, open as new window
  const width = options?.width || 1200;
  const height = options?.height || 800;
  const name = options?.name || `renderiq-${Date.now()}`;

  const windowFeatures = `width=${width},height=${height},left=${Math.floor((window.screen.availWidth - width) / 2)},top=${Math.floor((window.screen.availHeight - height) / 2)}`;

  return window.open(url, name, windowFeatures);
}

/**
 * Check if window management APIs are supported
 */
export function isWindowManagementSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'resizeTo' in window && 'moveTo' in window;
}

