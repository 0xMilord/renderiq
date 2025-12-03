'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { isOnline, onOnlineStatusChange } from '@/lib/utils/pwa';

export default function OfflinePage() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    const unsubscribe = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        // Reload page when back online
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });

    return unsubscribe;
  }, []);

  const handleRetry = () => {
    if (isOnline()) {
      window.location.reload();
    } else {
      // Try to reload anyway
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            {online
              ? 'Checking your connection...'
              : 'Please check your internet connection and try again.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Renderiq needs an internet connection to work properly.</p>
            <p>Some features may be available offline, but most functionality requires connectivity.</p>
          </div>
          <Button
            onClick={handleRetry}
            className="w-full"
            disabled={!online}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {online ? 'Retry Connection' : 'Waiting for Connection...'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



