'use client';

import { useState, useEffect, useCallback } from 'react';
import { Slide1Hero } from './slides/slide-1-hero';
import { Slide2Problem } from './slides/slide-2-problem';
import { Slide3ChatInterface } from './slides/slide-3-chat-interface';
import { Slide4RenderChains } from './slides/slide-4-render-chains';
import { Slide5CanvasEditor } from './slides/slide-5-canvas-editor';
import { Slide6AECFinetunes } from './slides/slide-6-aec-finetunes';
import { Slide7Pricing } from './slides/slide-7-pricing';
import { DemoControls } from './demo-controls';
import type { GalleryItemWithDetails } from '@/lib/types';

const SLIDE_DURATION = 10000; // 10 seconds per slide
const CHAT_SLIDE_DURATION = 30000; // 30 seconds for chat interface (longer demo)

const slides = [
  { id: 1, component: Slide1Hero, duration: SLIDE_DURATION },
  { id: 2, component: Slide2Problem, duration: SLIDE_DURATION },
  { id: 3, component: Slide3ChatInterface, duration: CHAT_SLIDE_DURATION },
  { id: 4, component: Slide4RenderChains, duration: SLIDE_DURATION },
  { id: 5, component: Slide5CanvasEditor, duration: SLIDE_DURATION },
  { id: 6, component: Slide6AECFinetunes, duration: SLIDE_DURATION },
  { id: 7, component: Slide7Pricing, duration: SLIDE_DURATION },
];

interface DemoSlideshowProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: any[];
}

export function DemoSlideshow({ galleryRenders = [], longestChains = [] }: DemoSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentSlideDuration = slides[currentSlide]?.duration || SLIDE_DURATION;
  const [timeRemaining, setTimeRemaining] = useState(currentSlideDuration);

  // Update time remaining when slide changes
  useEffect(() => {
    setTimeRemaining(currentSlideDuration);
  }, [currentSlide, currentSlideDuration]);

  // Auto-advance slides
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          const nextSlide = (currentSlide + 1) % slides.length;
          setCurrentSlide(nextSlide);
          return slides[nextSlide]?.duration || SLIDE_DURATION;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlide]);

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (error) {
        console.log('Fullscreen not available:', error);
      }
    };

    enterFullscreen();

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'r':
        case 'R':
          restart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % slides.length;
    setCurrentSlide(next);
    setTimeRemaining(slides[next]?.duration || SLIDE_DURATION);
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    setCurrentSlide(prev);
    setTimeRemaining(slides[prev]?.duration || SLIDE_DURATION);
  }, [currentSlide]);

  const restart = useCallback(() => {
    setCurrentSlide(0);
    setTimeRemaining(slides[0]?.duration || SLIDE_DURATION);
    setIsPlaying(true);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen toggle failed:', error);
    }
  }, []);

  const CurrentSlideComponent = slides[currentSlide].component;
  const progress = ((currentSlideDuration - timeRemaining) / currentSlideDuration) * 100;

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setTimeRemaining(slides[index]?.duration || SLIDE_DURATION);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Override UnifiedChatInterface height for full screen demo (no navbar) */
        .demo-slideshow-container .demo-chat-fullscreen > div {
          height: 100vh !important;
        }
        .demo-slideshow-container .demo-chat-fullscreen > div > div {
          height: 100vh !important;
        }
        /* Hide back button and mobile header in demo */
        .demo-slideshow-container .lg\\:hidden.border-b {
          display: none !important;
        }
        .demo-slideshow-container button:has(svg.lucide-arrow-left) {
          display: none !important;
        }
      `}} />
      <div className="fixed inset-0 bg-background overflow-hidden demo-slideshow-container">
        {/* Slide Content */}
        <div className="absolute inset-0">
          {currentSlide === 1 && <Slide2Problem galleryRenders={galleryRenders} />}
          {currentSlide === 2 && <Slide3ChatInterface galleryRenders={galleryRenders} longestChains={longestChains} />}
          {currentSlide === 4 && <Slide5CanvasEditor galleryRenders={galleryRenders} />}
          {currentSlide !== 1 && currentSlide !== 2 && currentSlide !== 4 && <CurrentSlideComponent />}
        </div>

        {/* Controls */}
        <DemoControls
          currentSlide={currentSlide}
          totalSlides={slides.length}
          isPlaying={isPlaying}
          isFullscreen={isFullscreen}
          progress={progress}
          onPrevSlide={prevSlide}
          onNextSlide={nextSlide}
          onTogglePlayPause={togglePlayPause}
          onRestart={restart}
          onToggleFullscreen={toggleFullscreen}
          onGoToSlide={goToSlide}
        />
      </div>
    </>
  );
}

