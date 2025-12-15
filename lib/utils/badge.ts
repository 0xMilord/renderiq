/**
 * Badge API Utilities
 * Show badge on app icon for updates and notifications
 */

/**
 * Set app badge with count
 */
export async function setAppBadge(count?: number): Promise<void> {
  if (typeof navigator === 'undefined') return;
  
  if ('setAppBadge' in navigator) {
    try {
      await (navigator as any).setAppBadge(count);
    } catch (error) {
      console.warn('Failed to set app badge:', error);
    }
  }
}

/**
 * Clear app badge
 */
export async function clearAppBadge(): Promise<void> {
  if (typeof navigator === 'undefined') return;
  
  if ('clearAppBadge' in navigator) {
    try {
      await (navigator as any).clearAppBadge();
    } catch (error) {
      console.warn('Failed to clear app badge:', error);
    }
  }
}

/**
 * Check if Badge API is supported
 */
export function isBadgeSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}







