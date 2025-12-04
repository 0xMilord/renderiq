'use client';

import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
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
  return (
    <>
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-border/50 z-50">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls Overlay - Bottom Left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevSlide}
          className="text-foreground/80 hover:text-foreground hover:bg-muted"
        >
          ←
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePlayPause}
          className="text-foreground/80 hover:text-foreground hover:bg-muted"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestart}
          className="text-foreground/80 hover:text-foreground hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextSlide}
          className="text-foreground/80 hover:text-foreground hover:bg-muted"
        >
          →
        </Button>
      </div>

      {/* Slide Indicator - Bottom Left */}
      <div className="absolute bottom-16 left-4 flex items-center gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onGoToSlide(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentSlide
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>

      {/* Fullscreen Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFullscreen}
        className="absolute top-4 right-4 text-foreground/80 hover:text-foreground hover:bg-muted z-50"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>

      {/* Slide Counter */}
      <div className="absolute top-4 left-4 text-muted-foreground text-sm z-50">
        {currentSlide + 1} / {totalSlides}
      </div>
    </>
  );
}

