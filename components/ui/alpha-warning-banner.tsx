'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AlphaWarningBannerProps {
  platform: 'canvas' | 'tools';
  className?: string;
  onDismiss?: () => void;
}

export function AlphaWarningBanner({ platform, className, onDismiss }: AlphaWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const platformName = platform === 'canvas' ? 'Canvas' : 'Tools';
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  if (isDismissed) {
    return null;
  }
  
  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-100",
        "mb-4 rounded-lg relative pr-10",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertTitle className="font-semibold text-yellow-900 dark:text-yellow-100">
        {platformName} Alpha Release
      </AlertTitle>
      <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 leading-relaxed">
        {platformName} is currently in <strong>alpha stage</strong> and may experience issues and unexpected behavior. ETA to finalization: <strong>December 20, 2025</strong>.
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20"
        onClick={handleDismiss}
        aria-label="Dismiss warning"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </Alert>
  );
}

