'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import { toast } from 'sonner';

interface AutoInstallDialogProps {
  delay?: number; // Delay in milliseconds before showing dialog
  showAfterPageViews?: number; // Show after N page views
  showAfterTime?: number; // Show after N seconds on site
}

export function AutoInstallDialog({ 
  delay = 10000, // 10 seconds default
  showAfterPageViews = 2,
  showAfterTime = 30000 // 30 seconds default
}: AutoInstallDialogProps) {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or can't install
    if (isInstalled || !canInstall || hasShown) return;

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check page views
    const pageViews = parseInt(localStorage.getItem('pwa-page-views') || '0');
    const timeOnSite = Date.now() - parseInt(localStorage.getItem('pwa-first-visit') || Date.now().toString());

    // Set first visit time
    if (!localStorage.getItem('pwa-first-visit')) {
      localStorage.setItem('pwa-first-visit', Date.now().toString());
    }

    // Increment page views
    localStorage.setItem('pwa-page-views', (pageViews + 1).toString());

    // Show dialog based on conditions
    const shouldShow = 
      pageViews >= showAfterPageViews || 
      timeOnSite >= showAfterTime;

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, hasShown, delay, showAfterPageViews, showAfterTime]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await install();
      if (success) {
        toast.success('wentire thinng is installing...');
        setIsOpen(false);
      } else {
        toast.info('Installation cancelled');
      }
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Failed to install app');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleLater = () => {
    setIsOpen(false);
    // Don't set dismissed flag, allow showing again later
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <DialogTitle className="text-lg font-semibold">
                Install wentire thinng
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <DialogDescription className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get the full wentire thinng experience with our app. Install it on your device for:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Mobile Access</p>
                <p className="text-xs text-muted-foreground">Use on your phone like a native app</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Offline Support</p>
                <p className="text-xs text-muted-foreground">Work without internet connection</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Faster Loading</p>
                <p className="text-xs text-muted-foreground">Quick access from your home screen</p>
              </div>
            </div>
          </div>
        </DialogDescription>
        
        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1"
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
          
          <Button
            variant="outline"
            onClick={handleLater}
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Don't show again
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
