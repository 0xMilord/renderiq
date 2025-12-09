/**
 * Post-Install Setup Utilities
 * Configure PWA after installation
 */

import { isPWAInstalled, getDisplayMode } from './pwa';
import { initializeWindowSize } from './window-management';

/**
 * Setup post-install experience
 */
export function setupPostInstallExperience(): void {
  if (!isPWAInstalled()) return;

  // Initialize window size and position
  initializeWindowSize();

  // Update window title based on current page
  updateWindowTitle();

  // Could add welcome message or onboarding here
}

/**
 * Update window title based on current page
 * Enhanced with more route coverage
 */
function updateWindowTitle(): void {
  if (typeof window === 'undefined') return;

  const pathname = window.location.pathname;
  let title = 'Renderiq';

  if (pathname.startsWith('/render')) {
    title = 'Render - Renderiq';
  } else if (pathname.startsWith('/dashboard')) {
    title = 'Dashboard - Renderiq';
  } else if (pathname.startsWith('/gallery')) {
    title = 'Gallery - Renderiq';
  } else if (pathname.startsWith('/project/')) {
    title = 'Project - Renderiq';
  } else if (pathname.startsWith('/apps/')) {
    title = 'Apps - Renderiq';
  } else if (pathname.startsWith('/pricing')) {
    title = 'Pricing - Renderiq';
  }

  document.title = title;
}

