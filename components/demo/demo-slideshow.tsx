'use client';

import { useState, useEffect, useCallback } from 'react';
import { Slide1Hero } from './slides/slide-1-hero';
import { Slide2Problem } from './slides/slide-2-problem';
import { Slide21Video } from './slides/slide-2-1-video';
import { Slide3ChatInterface } from './slides/slide-3-chat-interface';
import { Slide3UnifiedChat } from './slides/slide-3-unified-chat';
import { Slide4RenderChains } from './slides/slide-4-render-chains';
import { Slide5CanvasEditor } from './slides/slide-5-canvas-editor';
import { Slide6AECFinetunes } from './slides/slide-6-aec-finetunes';
import { Slide7Pricing } from './slides/slide-7-pricing';
import { DemoControls } from './demo-controls';
import type { GalleryItemWithDetails } from '@/lib/types';

const SLIDE_DURATION = 10000; // 10 seconds per slide
const SLIDE_1_DURATION = 4000; // 4 seconds for first slide (hero)
const CHAT_SLIDE_DURATION = 60000; // 60 seconds for chat interface (slowed down 50% - 12s per image × 5 images)
const SLIDE_2_DURATION = 50000; // 50 seconds for slide 2 (before/after comparison) - increased to show more images
const SLIDE_21_DURATION = 15000; // 15 seconds for slide 2.1 (video generation)

const slides = [
  { id: 0, component: Slide1Hero, duration: SLIDE_1_DURATION },
  { id: 1, component: Slide2Problem, duration: SLIDE_2_DURATION },
  { id: 2, component: Slide21Video, duration: SLIDE_21_DURATION },
  { id: 3, component: Slide3UnifiedChat, duration: CHAT_SLIDE_DURATION },
  { id: 4, component: Slide3ChatInterface, duration: CHAT_SLIDE_DURATION },
  { id: 5, component: Slide4RenderChains, duration: SLIDE_DURATION },
  { id: 6, component: Slide5CanvasEditor, duration: SLIDE_DURATION },
  { id: 7, component: Slide6AECFinetunes, duration: SLIDE_DURATION },
  { id: 8, component: Slide7Pricing, duration: SLIDE_DURATION },
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

  const handleVideoComplete = () => {
    // Auto-advance to next slide when video completes
    const nextSlide = (currentSlide + 1) % slides.length;
    setCurrentSlide(nextSlide);
    setTimeRemaining(slides[nextSlide]?.duration || SLIDE_DURATION);
  };

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
    setTimeRemaining(SLIDE_1_DURATION);
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

  const CurrentSlideComponent = slides[currentSlide]?.component;
  const progress = ((currentSlideDuration - timeRemaining) / currentSlideDuration) * 100;

  // Get slide component props
  const getSlideProps = useCallback(() => {
    const slideId = slides[currentSlide]?.id;
    if (slideId === 0) return {};
    if (slideId === 1) return { galleryRenders };
    if (slideId === 2) return { galleryRenders, onVideoComplete: handleVideoComplete };
    if (slideId === 3) return { galleryRenders, longestChains };
    if (slideId === 4) return { galleryRenders, longestChains };
    if (slideId === 5) return { galleryRenders, longestChains };
    if (slideId === 6) return { galleryRenders };
    if (slideId === 7) return {};
    if (slideId === 8) return {};
    return {};
  }, [currentSlide, galleryRenders, longestChains, handleVideoComplete]);

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
        /* Override UnifiedChatInterface height calculation in demo - use container height instead of calc(100vh-2.75rem) */
        .demo-slideshow-container .demo-unified-chat-container > div {
          height: 100% !important;
          max-height: 100% !important;
        }
        .demo-slideshow-container .demo-unified-chat-container > div > div {
          height: 100% !important;
          max-height: 100% !important;
        }
        /* Override the calc(100vh-2.75rem) height class */
        .demo-slideshow-container .demo-unified-chat-container > div[class*="h-\\[calc\\(100vh"] {
          height: 100% !important;
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
          {slides[currentSlide]?.id === 1 && <Slide2Problem galleryRenders={galleryRenders} />}
          {slides[currentSlide]?.id === 2 && <Slide21Video galleryRenders={galleryRenders} onVideoComplete={handleVideoComplete} />}
          {slides[currentSlide]?.id === 3 && <Slide3UnifiedChat galleryRenders={galleryRenders} longestChains={longestChains} />}
          {slides[currentSlide]?.id === 4 && <Slide3ChatInterface galleryRenders={galleryRenders} longestChains={longestChains} />}
          {slides[currentSlide]?.id === 5 && <Slide4RenderChains />}
          {slides[currentSlide]?.id === 6 && <Slide5CanvasEditor galleryRenders={galleryRenders} />}
          {![1, 2, 3, 4, 5, 6].includes(slides[currentSlide]?.id || -1) && CurrentSlideComponent && <CurrentSlideComponent {...getSlideProps()} />}
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

