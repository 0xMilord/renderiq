'use client';

import { useEffect } from 'react';
import { setupPostInstallExperience } from '@/lib/utils/post-install-setup';

/**
 * Post-Install Setup Component
 * Runs post-install setup on mount if PWA is installed
 */
export function PostInstallSetup() {
  useEffect(() => {
    // Run post-install setup on mount
    setupPostInstallExperience();
  }, []);

  return null;
}








