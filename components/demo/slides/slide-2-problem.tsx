'use client';

import { Clock, Zap, CheckCircle2, ChevronLeft, ChevronRight, Send, MessageSquare, Upload, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';

interface Slide2ProblemProps {
  galleryRenders?: GalleryItemWithDetails[];
}

export function Slide2Problem({ galleryRenders = [] }: Slide2ProblemProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0); // Start from left (0%)
  const [typingText, setTypingText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: 'user' }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Use gallery renders directly in order (simple logic like gallery does)
  // Filter for images with both uploaded and output URLs
  const beforeAfterPairs = galleryRenders
    .filter(r => 
      r.render?.uploadedImageUrl && 
      r.render?.outputUrl && 
      r.render?.status === 'completed' && 
      r.render?.type === 'image'
    )
    .slice(0, 10); // Limit to 10 images max

  const currentPair = beforeAfterPairs[currentIndex] || beforeAfterPairs[0];
  const currentPrompt = currentPair?.render?.prompt || '';
  const hasUploadedImage = !!currentPair?.render?.uploadedImageUrl;

  // Helper function to truncate text at last period
  const truncateAtLastPeriod = (text: string): string => {
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex === -1) return text; // No period found, return full text
    return text.substring(0, lastPeriodIndex + 1);
  };

  // Track when slider cycle completes to trigger prompt change
  const [sliderCycleComplete, setSliderCycleComplete] = useState(false);
  const [lastTypedIndex, setLastTypedIndex] = useState(-1);

  // Auto-animate slider position (left to right) - doubled speed
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderPosition((prev) => {
        if (prev >= 100) {
          // Slider completed - mark as complete
          setSliderCycleComplete(true);
          // Advance to next image after a brief delay
          if (beforeAfterPairs.length > 1) {
            setTimeout(() => {
              setCurrentIndex((prevIndex) => (prevIndex + 1) % beforeAfterPairs.length);
            }, 50);
          }
          return 0; // Reset to start (left)
        }
        return prev + 1.0; // Move right (increase) - doubled speed
      });
    }, 50); // Update every 50ms for smooth animation
    return () => clearInterval(interval);
  }, [currentIndex, beforeAfterPairs.length]);

  // Auto-type prompt when image changes (only after slider cycle completes)
  useEffect(() => {
    // Only trigger when:
    // 1. We have a prompt
    // 2. Slider cycle is complete
    // 3. We haven't typed for this index yet
    if (!currentPrompt || !sliderCycleComplete || lastTypedIndex === currentIndex) return;
    
    // Mark this index as typed
    setLastTypedIndex(currentIndex);
    
    // Clear old messages before starting new typing
    setMessages([]);
    
    // Truncate prompt at last period
    const truncatedPrompt = truncateAtLastPeriod(currentPrompt);
    
    setIsTyping(true);
    setTypingText('');
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (charIndex < truncatedPrompt.length) {
        setTypingText(truncatedPrompt.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        // After typing completes, wait a bit then send as message
        setTimeout(() => {
          setIsTyping(false);
          setMessages([{
            id: `msg-${currentIndex}-${Date.now()}`,
            text: truncatedPrompt,
            type: 'user' as const
          }]);
          setTypingText('');
          // Reset cycle complete flag after typing starts
          setSliderCycleComplete(false);
        }, 500);
      }
    }, 15); // Typing speed: 15ms per character (doubled from 30ms)

    return () => clearInterval(typingInterval);
  }, [currentIndex, currentPrompt, sliderCycleComplete, lastTypedIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + beforeAfterPairs.length) % beforeAfterPairs.length);
    setSliderPosition(0); // Reset to start (left)
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % beforeAfterPairs.length);
    setSliderPosition(0); // Reset to start (left)
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-8 relative z-10 h-full flex flex-col">
        {/* Main Content - 2 Column Layout: Chat on Left, Slideshow on Right */}
        <div className="flex-1 flex items-center gap-8 min-h-0 py-8">
          {/* Left Column - Chat Interface Simulation */}
          <div className="flex-1 flex flex-col h-full max-w-md">
            <div className="bg-card rounded-lg border border-border shadow-lg h-full flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-2">
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="Renderiq"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">Renderiq Chat</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Box - Auto-typing */}
              <div className="p-4 border-t border-border">
                <div className="relative">
                  <Textarea
                    value={typingText}
                    readOnly
                    placeholder="Describe your vision..."
                    className={cn(
                      "h-[60px] resize-none w-full text-xs sm:text-sm pr-20",
                      isTyping && "border-primary/50 bg-primary/5"
                    )}
                  />
                  {/* Upload indicator and Send button - 1 row 2 col */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    {hasUploadedImage && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-[10px] text-primary">
                        <ImageIcon className="h-3 w-3" />
                        <span>Image</span>
                      </div>
                    )}
                    {isTyping ? (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    ) : (
                      <Button
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Before/After Slider */}
          <div className="flex-1 flex items-center justify-center min-h-0">
          {currentPair && currentPair.render.uploadedImageUrl && currentPair.render.outputUrl ? (
            <>
              <style dangerouslySetInnerHTML={{ __html: `
                .slide-2-slider-wrapper .react-before-after-slider-container {
                  width: 100% !important;
                  height: 100% !important;
                }
                .slide-2-slider-wrapper .react-before-after-slider-container img {
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: cover !important;
                }
              `}} />
              <div className="relative w-full max-w-6xl h-full max-h-[70vh] slide-2-slider-wrapper">
                <div className="relative w-full h-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
                  <ReactBeforeSliderComponent
                    firstImage={{ imageUrl: currentPair.render.uploadedImageUrl }}
                    secondImage={{ imageUrl: currentPair.render.outputUrl }}
                    currentPercentPosition={sliderPosition}
                  />
                  {/* Labels Over Image - After on left, Before on right */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10">
                    After
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10">
                    Before
                  </div>
                </div>
              
              {/* Slideshow Navigation */}
              {beforeAfterPairs.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full z-10 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full z-10 transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Slide Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {beforeAfterPairs.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index);
                          setSliderPosition(0); // Reset to start (left)
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex 
                            ? 'bg-white w-8' 
                            : 'bg-white/50 w-2 hover:bg-white/75'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">✏️ → 🏢</div>
              <p className="text-2xl font-semibold text-foreground">From Sketch to Photorealistic Render</p>
            </div>
          )}
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center pb-8">
          <h2 className="text-xl md:text-xl lg:text-2xl font-extrabold text-foreground mb-6">
            Generate Approval-Ready Renders in{' '}
            <span className="text-primary inline-block">Seconds</span>
            {' '}Not Days
          </h2>
          
          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { icon: Clock, text: 'No 3D Modeling', color: 'text-blue-500' },
              { icon: Zap, text: 'Instant Results', color: 'text-primary' },
              { icon: CheckCircle2, text: 'No Technical Skills', color: 'text-green-500' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-card backdrop-blur-sm px-4 py-2 rounded-full border border-border"
              >
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
