'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';
import { setAppBadge, clearAppBadge } from '@/lib/utils/badge';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';

export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    if (isUpdateAvailable) {
      // Show badge when update is available
      setAppBadge(1).catch(() => {
        // Badge API not supported, ignore
      });
    } else {
      // Clear badge when no update available
      clearAppBadge().catch(() => {
        // Badge API not supported, ignore
      });
    }
  }, [isUpdateAvailable]);

  if (!isUpdateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const handleDismiss = () => {
    // Dismiss notification (will show again on next update)
    // Could store dismissal in localStorage if needed
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm animate-in slide-in-from-bottom-5">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Update Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A new version of Renderiq is available. Update now to get the latest features and improvements.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            className="flex-1"
          >
            Update Now
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}

