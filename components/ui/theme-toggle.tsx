'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'system' | 'light';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-muted-foreground">Theme</span>
        <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  const currentTheme = theme as Theme;
  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'dark', icon: <Moon className="h-3 w-3" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="h-3 w-3" />, label: 'System' },
    { value: 'light', icon: <Sun className="h-3 w-3" />, label: 'Light' },
  ];

  const getPosition = (themeValue: Theme) => {
    switch (themeValue) {
      case 'dark': return 'left-0.5';
      case 'system': return 'left-1/2 -translate-x-1/2';
      case 'light': return 'right-0.5';
      default: return 'right-0.5'; // Default to light theme
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-muted-foreground">Theme</span>
      <div className="relative">
        {/* Background track */}
        <div className="w-24 h-9 bg-muted rounded-lg p-1 flex">
          {themes.map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex-1 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-background/50 relative z-20",
                currentTheme === value && "bg-background shadow-sm"
              )}
              title={label}
            >
              <span className={cn(
                "transition-colors duration-200",
                currentTheme === value ? "text-primary" : "text-muted-foreground"
              )}>
                {icon}
              </span>
            </button>
          ))}
        </div>
        
        {/* Sliding indicator - positioned behind the selected button */}
        <div 
          className={cn(
            "absolute top-1 w-7 h-7 bg-background/80 border border-border rounded-md shadow-sm transition-all duration-200 pointer-events-none z-0",
            getPosition(currentTheme)
          )}
        />
      </div>
    </div>
  );
}
