'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';
import { detectOS, getInstallInstructions, isPWAInstalled, isIOS, isAndroid, isWindows } from '@/lib/utils/pwa';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

export function PWAInstallButton() {
  const { install, isInstallable, isInstalled } = usePWAInstall();
  const [os, setOS] = useState<'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setOS(detectOS());
  }, []);

  // Don't show if already installed
  if (isInstalled || isPWAInstalled()) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        logger.log('✅ PWA installed successfully');
      } else {
        // Show instructions for manual installation
        setShowInstructions(true);
      }
    } catch (error) {
      logger.error('❌ PWA installation failed:', error);
      setShowInstructions(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleManualInstall = () => {
    setShowInstructions(true);
  };

  // iOS - Show manual instructions
  if (isIOS()) {
    return (
      <>
        <Button
          onClick={handleManualInstall}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Install App
        </Button>
        <InstallInstructionsDialog
          open={showInstructions}
          onClose={() => setShowInstructions(false)}
          os={os}
        />
      </>
    );
  }

  // Android/Windows - Show install button if installable
  if (isInstallable) {
    return (
      <Button
        onClick={handleInstall}
        variant="default"
        size="sm"
        disabled={isInstalling}
        className="gap-2"
      >
        {isInstalling ? (
          <>
            <Monitor className="h-4 w-4 animate-spin" />
            Installing...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Install App
          </>
        )}
      </Button>
    );
  }

  // Fallback - Show manual install button
  return (
    <>
      <Button
        onClick={handleManualInstall}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
      <InstallInstructionsDialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        os={os}
      />
    </>
  );
}

interface InstallInstructionsDialogProps {
  open: boolean;
  onClose: () => void;
  os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
}

function InstallInstructionsDialog({ open, onClose, os }: InstallInstructionsDialogProps) {
  const instructions = getInstallInstructions(os);
  const isIOSDevice = isIOS();
  const isAndroidDevice = isAndroid();
  const isWindowsDevice = isWindows();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIOSDevice && <Smartphone className="h-5 w-5" />}
            {isAndroidDevice && <Smartphone className="h-5 w-5" />}
            {isWindowsDevice && <Monitor className="h-5 w-5" />}
            Install RenderIQ
          </DialogTitle>
          <DialogDescription>
            Follow these steps to install RenderIQ on your device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isIOSDevice && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">For iOS (Safari):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Tap the Share button (□↑) at the bottom of your screen</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>RenderIQ will appear on your home screen</li>
              </ol>
            </div>
          )}

          {isAndroidDevice && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">For Android (Chrome):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Tap the menu (⋮) in the top right corner</li>
                <li>Select "Add to Home screen" or "Install app"</li>
                <li>Tap "Install" or "Add"</li>
                <li>RenderIQ will be installed on your device</li>
              </ol>
            </div>
          )}

          {isWindowsDevice && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">For Windows (Edge/Chrome):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Look for the install icon (⊕) in your browser's address bar</li>
                <li>Click the install icon or use the browser menu</li>
                <li>Select "Install" when prompted</li>
                <li>RenderIQ will be added to your apps</li>
              </ol>
            </div>
          )}

          {!isIOSDevice && !isAndroidDevice && !isWindowsDevice && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">General Instructions:</h4>
              <p className="text-sm text-muted-foreground">{instructions}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


