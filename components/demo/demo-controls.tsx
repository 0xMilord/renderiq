'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Pause, Play, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoControlsProps {
  currentSlide: number;
  totalSlides: number;
  isPlaying: boolean;
  isFullscreen: boolean;
  progress: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onTogglePlayPause: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  onGoToSlide: (index: number) => void;
}

export function DemoControls({
  currentSlide,
  totalSlides,
  isPlaying,
  isFullscreen,
  progress,
  onPrevSlide,
  onNextSlide,
  onTogglePlayPause,
  onRestart,
  onToggleFullscreen,
  onGoToSlide,
}: DemoControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Floating Control Bar - Bottom Center */}
      <div className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
        isCollapsed 
          ? "bottom-0" 
          : "bottom-4"
      )}>
        <div className={cn(
          "bg-card/95 backdrop-blur-md border-2 border-border shadow-2xl flex items-center transition-all duration-300",
          isCollapsed 
            ? "min-w-[200px] max-w-[200px] cursor-pointer px-3 py-2 rounded-t-lg border-b-0" 
            : "min-w-[600px] max-w-[90vw] px-4 py-3 rounded-lg"
        )}>
          {/* Collapsed State - Show only progress bar */}
          {isCollapsed ? (
            <div 
              className="w-full flex items-center gap-2 cursor-pointer"
              onClick={() => setIsCollapsed(false)}
            >
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <>
          {/* Progress Indicator */}
          <div className="flex-1 min-w-0">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Slide Counter */}
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-border"></div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevSlide}
              className="h-8 w-8 p-0"
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePlayPause}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestart}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextSlide}
              className="h-8 w-8 p-0"
            >
              →
            </Button>
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-border"></div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => onGoToSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentSlide
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                )}
              />
            ))}
          </div>

          {/* Vertical Separator */}
          <div className="h-8 w-px bg-border"></div>

              {/* Fullscreen Toggle & Collapse */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(true)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

