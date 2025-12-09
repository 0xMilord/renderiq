'use client';

import { useEffect, useRef } from 'react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { toast } from 'sonner';

export function InstallSuccessToast() {
  const { isInstalled } = usePWAInstall();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (isInstalled && !hasShownRef.current) {
      hasShownRef.current = true;
      toast.success('🎉 Renderiq Installed!', {
        description: 'You can now access Renderiq from your home screen or app launcher.',
        duration: 5000,
      });
    }
  }, [isInstalled]);

  return null;
}

