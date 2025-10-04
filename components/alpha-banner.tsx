'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AlphaBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('alpha-banner-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }

    // Check if user is on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('alpha-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "bg-destructive/10 border-b border-destructive/20",
      "px-4 sm:px-6 lg:px-8 py-1 relative z-50"
    )}>
      <div className="flex items-center justify-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-destructive">
          arqihive is in early development and may experience issues.
        </span>
        {isMobile && (
          <div className="flex items-center space-x-1 text-destructive/80 text-xs ml-2">
            <Smartphone className="h-3 w-3" />
            <span>Use</span>
            <Monitor className="h-3 w-3" />
            <span className="font-medium">desktop</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-6 w-6 p-0 ml-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
