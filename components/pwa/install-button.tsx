'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface InstallButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function InstallButton({ 
  className, 
  variant = 'default', 
  size = 'default' 
}: InstallButtonProps) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setCanInstall(false);
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setIsInstalling(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!canInstall) return;

    setIsInstalling(true);

    try {
      // Access the global PWA object
      if ((window as any).pwa?.install) {
        await (window as any).pwa.install();
      } else {
        toast.error('Install prompt not available');
      }
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install app');
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show button if can't install
  if (!canInstall) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant={variant}
      size={size}
      className={className}
    >
      {isInstalling ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Installing...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
}

export function InstallInstructions() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));
    setIsDesktop(!/Mobile|Android|iPhone|iPad/.test(userAgent));
  }, []);

  if (isIOS) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          To install wentire thinng on iOS:
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <span>1. Tap</span>
          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded">
            <span>Share</span>
          </div>
          <span>2. Select</span>
          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded">
            <span>Add to Home Screen</span>
          </div>
        </div>
      </div>
    );
  }

  if (isAndroid) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          To install wentire thinng on Android:
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <span>1. Tap the menu</span>
          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded">
            <span>⋮</span>
          </div>
          <span>2. Select</span>
          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded">
            <span>Add to Home Screen</span>
          </div>
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          To install wentire thinng on desktop:
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm">
          <span>1. Click the install button above</span>
          <span>2. Or use your browser's install option</span>
        </div>
      </div>
    );
  }

  return null;
}
