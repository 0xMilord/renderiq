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
  } else if (pathname.startsWith('/apps')) {
    title = 'Apps - Renderiq';
  } else if (pathname !== '/' && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/u/') && !pathname.startsWith('/gallery') && !pathname.startsWith('/pricing') && !pathname.startsWith('/use-cases') && !pathname.startsWith('/render') && !pathname.startsWith('/canvas') && !pathname.startsWith('/project') && !pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/auth') && !pathname.startsWith('/blog') && !pathname.startsWith('/docs') && !pathname.startsWith('/about') && !pathname.startsWith('/contact') && !pathname.startsWith('/privacy') && !pathname.startsWith('/terms')) {
    // This might be a tool slug at root level
    title = 'Tool - Renderiq';
  } else if (pathname.startsWith('/pricing')) {
    title = 'Pricing - Renderiq';
  }

  document.title = title;
}

