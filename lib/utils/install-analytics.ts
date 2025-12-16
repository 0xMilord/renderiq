/**
 * Install Analytics Utilities
 * Track PWA install events and conversion rates
 */

import { detectOS } from './pwa';

export type InstallEvent = 
  | 'prompt_shown' 
  | 'prompt_accepted' 
  | 'prompt_dismissed' 
  | 'install_completed' 
  | 'install_failed';

/**
 * Track install event
 */
export function trackInstallEvent(
  event: InstallEvent,
  data?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  const eventData = {
    event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: detectOS(),
    ...data,
  };

  // Google Analytics
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'pwa_install', {
      event_category: 'PWA',
      event_label: event,
      value: 1,
      ...data,
    });
  }

  // Custom analytics endpoint
  fetch('/api/analytics/install', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  }).catch((error) => {
    console.error('Failed to track install event:', error);
  });
}








