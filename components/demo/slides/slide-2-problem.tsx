'use client';

import { Clock, Zap, CheckCircle2, ChevronLeft, ChevronRight, Send, MessageSquare, Upload, Image as ImageIcon, Video, Sparkles, Lock, Globe, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

interface Slide2ProblemProps {
  galleryRenders?: GalleryItemWithDetails[];
}

export function Slide2Problem({ galleryRenders = [] }: Slide2ProblemProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(0); // Start from left (0%)
  const [typingText, setTypingText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: 'user'; uploadedImageUrl?: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  // Demo state for input controls
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [environment, setEnvironment] = useState('none');
  const [effect, setEffect] = useState('none');
  const [temperature, setTemperature] = useState('0.5');
  const [quality, setQuality] = useState('standard');
  const [isPublic, setIsPublic] = useState(true);

  const toggleMessageExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Use most popular gallery items (already sorted by popularity from demo page)
  // Filter for images with both uploaded and output URLs
  // Take first 5 most popular items that have before/after pairs
  const beforeAfterPairs = galleryRenders
    .filter(r => 
      r.render?.uploadedImageUrl && 
      r.render?.outputUrl && 
      r.render?.status === 'completed' && 
      r.render?.type === 'image'
    )
    .slice(0, 5); // Limit to 5 most popular images max

  const currentPair = beforeAfterPairs[currentIndex] || beforeAfterPairs[0];
  const currentPrompt = currentPair?.render?.prompt || '';
  const hasUploadedImage = !!currentPair?.render?.uploadedImageUrl;

  // Helper function to truncate text at last period
  const truncateAtLastPeriod = (text: string): string => {
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex === -1) return text; // No period found, return full text
    return text.substring(0, lastPeriodIndex + 1);
  };

  // Helper function to get text that fits in 3 lines (approximately 120-150 characters)
  const getTextForThreeLines = (text: string): string => {
    // Approximate: 3 lines * ~40-50 chars per line = ~120-150 chars
    // Find the last space before 120 chars to avoid breaking words
    const maxChars = 120;
    if (text.length <= maxChars) return text;
    
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 80) {
      return truncated.substring(0, lastSpace) + '...';
    }
    return truncated.substring(0, maxChars) + '...';
  };

  // Track when slider cycle completes to trigger prompt change
  const [sliderCycleComplete, setSliderCycleComplete] = useState(true); // Start as true to trigger first prompt
  const [lastTypedIndex, setLastTypedIndex] = useState(-1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-animate slider position (left to right) - doubled speed
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderPosition((prev) => {
        if (prev >= 100) {
          // Slider completed - prevent new typing during transition
          setIsTransitioning(true);
          setSliderCycleComplete(false); // Reset before transition
          
          // Advance to next image after a brief delay
          if (beforeAfterPairs.length > 1) {
            setTimeout(() => {
              const nextIndex = (currentIndex + 1) % beforeAfterPairs.length;
              setCurrentIndex(nextIndex);
              setSliderPosition(0); // Reset slider position
              setLastTypedIndex(-1); // Reset typed index to allow new typing
              // Mark as complete AFTER index has changed
              setTimeout(() => {
                setSliderCycleComplete(true);
                setIsTransitioning(false);
              }, 100); // Small delay to ensure state is updated
            }, 500);
          } else {
            // If only one image, reset after delay
            setTimeout(() => {
              setSliderPosition(0);
              setLastTypedIndex(-1);
              setSliderCycleComplete(true);
              setIsTransitioning(false);
            }, 500);
          }
          return 0; // Reset to start (left)
        }
        return prev + 1.0; // Move right (increase) - doubled speed
      });
    }, 50); // Update every 50ms for smooth animation
    return () => clearInterval(interval);
  }, [beforeAfterPairs.length, currentIndex]);

  // Auto-type prompt when image changes (only after slider cycle completes)
  useEffect(() => {
    // Only trigger when:
    // 1. We have a prompt
    // 2. Slider cycle is complete
    // 3. Not currently transitioning
    // 4. We haven't typed for this index yet
    if (!currentPrompt || !sliderCycleComplete || isTransitioning) return;
    if (lastTypedIndex === currentIndex) return;
    
    // Capture the current pair data at the start of typing to ensure sync
    const pairForThisMessage = beforeAfterPairs[currentIndex];
    if (!pairForThisMessage) return;
    
    // Mark this index as typed
    setLastTypedIndex(currentIndex);
    
    // Clear old messages and typing text before starting new typing
    setMessages([]);
    setTypingText('');
    
    // Get full prompt for message bubble from the captured pair
    const fullPrompt = truncateAtLastPeriod(pairForThisMessage.render?.prompt || '');
    // Get text for 3 lines in textarea (limited display)
    const textForTextarea = getTextForThreeLines(fullPrompt);
    
    // Small delay before starting to type
    setTimeout(() => {
      setIsTyping(true);
      let charIndex = 0;
      
      const typingInterval = setInterval(() => {
        // Only type up to 3 lines worth in the textarea
        if (charIndex < textForTextarea.length) {
          setTypingText(textForTextarea.substring(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          // After typing 3 lines, immediately send full prompt as message
          // Use the captured pair data to ensure correct image URL
          setTimeout(() => {
            setIsTyping(false);
            setMessages([{
              id: `msg-${currentIndex}-${Date.now()}`,
              text: fullPrompt, // Full prompt in message bubble
              type: 'user' as const,
              uploadedImageUrl: pairForThisMessage.render?.uploadedImageUrl
            }]);
            setTypingText('');
            // Reset cycle complete flag after message is sent
            setSliderCycleComplete(false);
          }, 300); // Reduced delay to sync better
        }
      }, 15); // Typing speed: 15ms per character
    }, 300);

    // No cleanup needed - we want the typing to complete
  }, [currentIndex, currentPrompt, sliderCycleComplete, lastTypedIndex, isTransitioning, beforeAfterPairs]);

  const handlePrev = () => {
    setIsTransitioning(true);
    setSliderCycleComplete(false);
    const newIndex = (currentIndex - 1 + beforeAfterPairs.length) % beforeAfterPairs.length;
    setCurrentIndex(newIndex);
    setSliderPosition(0); // Reset to start (left)
    setLastTypedIndex(-1); // Reset typed index
    setTimeout(() => {
      setSliderCycleComplete(true);
      setIsTransitioning(false);
    }, 100);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setSliderCycleComplete(false);
    const newIndex = (currentIndex + 1) % beforeAfterPairs.length;
    setCurrentIndex(newIndex);
    setSliderPosition(0); // Reset to start (left)
    setLastTypedIndex(-1); // Reset typed index
    setTimeout(() => {
      setSliderCycleComplete(true);
      setIsTransitioning(false);
    }, 100);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Generate Approval-Ready Renders
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              Generate approval-ready renders in seconds, not days. No 3D modeling or technical skills required.
            </p>
          </div>
          {/* QR Code - Right Edge */}
          <div className="flex-shrink-0 flex flex-row items-center gap-1.5">
            <div className="p-0.5 bg-primary/10 rounded border border-primary/30 flex-shrink-0">
              <QRCodeSVG
                value="https://renderiq.io/api/qr-signup"
                size={50}
                level="M"
                includeMargin={false}
                className="rounded"
                fgColor="hsl(var(--primary))"
                bgColor="transparent"
              />
            </div>
            <p className="text-[12px] text-primary font-semibold leading-tight max-w-[100px]">
              Visualize UniAcoustics products on Renderiq!
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-8 relative z-10 flex-1 flex flex-col min-h-0">
        {/* Main Content - 2 Column Layout: Chat on Left, Slideshow on Right */}
        <div className="flex-1 flex items-center gap-8 min-h-0 py-8">
          {/* Left Column - Chat Interface Simulation */}
          <div className="flex-[1] flex flex-col h-full w-full">
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
                {messages.map((msg) => {
                  const isExpanded = expandedMessages.has(msg.id);
                  // Check if text is long enough to need truncation (roughly 4 lines)
                  const shouldTruncate = msg.text.length > 150;
                  
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 max-w-[85%] space-y-2">
                        {/* Show uploaded image as attachment if available */}
                        {msg.uploadedImageUrl && (
                          <div className="relative w-full max-w-[200px] rounded-lg overflow-hidden border-2 border-primary-foreground/20 mb-2">
                            <div className="relative aspect-square w-full">
                              <Image
                                src={msg.uploadedImageUrl}
                                alt="Uploaded image"
                                fill
                                className="object-cover"
                                sizes="200px"
                              />
                            </div>
                            <div className="absolute top-1 right-1 bg-primary-foreground/80 text-primary px-1.5 py-0.5 rounded text-[8px] font-medium flex items-center gap-1">
                              <ImageIcon className="h-2.5 w-2.5" />
                              <span>Image</span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className={cn(
                            "text-sm sm:text-base break-words",
                            isExpanded ? "whitespace-pre-wrap" : "line-clamp-4"
                          )}>
                            {msg.text}
                          </p>
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleMessageExpand(msg.id)}
                              className="text-xs text-primary-foreground/80 hover:text-primary-foreground underline font-medium"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area - Matching Unified Chat Interface */}
              <div className="p-2 sm:p-3 border-t border-border flex-shrink-0 space-y-2">
                {/* Top Row: Private Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="privacy-toggle" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                    {isPublic ? (
                      <>
                        <Globe className="h-3 w-3" />
                        <span className="hidden sm:inline">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        <span className="hidden sm:inline">Private</span>
                      </>
                    )}
                  </Label>
                  <Switch
                    id="privacy-toggle"
                    checked={!isPublic}
                    onCheckedChange={(checked) => setIsPublic(!checked)}
                    disabled
                  />
                </div>
                
                {/* Prompt Input */}
                <div className="flex gap-1 sm:gap-2">
                  <div className="relative flex-1 flex flex-col">
                    <Textarea
                      value={typingText}
                      readOnly
                      placeholder="Describe your vision..."
                      className={cn(
                        "h-[60px] sm:h-[70px] resize-none w-full text-xs sm:text-sm",
                        isTyping && "border-primary/50 bg-primary/5",
                        isVideoMode && "border-primary/50 bg-primary/5"
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                      disabled
                    >
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 sm:h-9 w-8 sm:w-9 shrink-0"
                      disabled
                    >
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Style Settings - 2 columns: Environment/Temperature (3/4) and Style Transfer (1/4) */}
                <div>
                  <div className="flex gap-1.5 sm:gap-2 items-stretch">
                    {/* Left Column: Environment/Effect and Temperature (3/4 width, 2 rows) */}
                    <div className="flex-[3] flex flex-col gap-1.5 sm:gap-2">
                      {/* Row 1: Mode Toggle, Environment and Effect dropdowns */}
                      <div className="flex gap-1.5 sm:gap-2 items-start">
                        {/* Mode Toggle */}
                        <div className="space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label className="text-[10px] sm:text-xs font-medium cursor-help">Mode</Label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Switch between image and video generation modes</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex gap-0.5 border rounded p-0.5">
                            <Button
                              variant={!isVideoMode ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setIsVideoMode(false)}
                              className={cn(
                                "h-6 sm:h-7 w-6 sm:w-7 p-0",
                                !isVideoMode && "bg-primary text-primary-foreground"
                              )}
                              title="Image Mode"
                              disabled
                            >
                              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant={isVideoMode ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setIsVideoMode(true)}
                              className={cn(
                                "h-6 sm:h-7 w-6 sm:w-7 p-0",
                                isVideoMode && "bg-primary text-primary-foreground"
                              )}
                              title="Video Mode"
                              disabled
                            >
                              <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Environment Dropdown */}
                        <div className="space-y-1 flex flex-col flex-1">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] sm:text-xs font-medium">Environment</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Set the weather and lighting conditions</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={environment} onValueChange={setEnvironment} disabled>
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue placeholder="Select environment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-[10px] sm:text-xs">None</SelectItem>
                              <SelectItem value="sunny" className="text-[10px] sm:text-xs">Sunny</SelectItem>
                              <SelectItem value="overcast" className="text-[10px] sm:text-xs">Overcast</SelectItem>
                              <SelectItem value="rainy" className="text-[10px] sm:text-xs">Rainy</SelectItem>
                              <SelectItem value="sunset" className="text-[10px] sm:text-xs">Sunset</SelectItem>
                              <SelectItem value="sunrise" className="text-[10px] sm:text-xs">Sunrise</SelectItem>
                              <SelectItem value="night" className="text-[10px] sm:text-xs">Night</SelectItem>
                              <SelectItem value="foggy" className="text-[10px] sm:text-xs">Foggy</SelectItem>
                              <SelectItem value="cloudy" className="text-[10px] sm:text-xs">Cloudy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Effect Dropdown */}
                        <div className="space-y-1 flex flex-col flex-1">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] sm:text-xs font-medium">Effect</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Choose visualization style and rendering mode</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={effect} onValueChange={setEffect} disabled>
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue placeholder="Select effect" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-[10px] sm:text-xs">None</SelectItem>
                              <SelectItem value="wireframe" className="text-[10px] sm:text-xs">Wireframe</SelectItem>
                              <SelectItem value="photoreal" className="text-[10px] sm:text-xs">Photoreal</SelectItem>
                              <SelectItem value="illustration" className="text-[10px] sm:text-xs">Illustration</SelectItem>
                              <SelectItem value="sketch" className="text-[10px] sm:text-xs">Sketch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: Temperature and Quality */}
                      <div className="space-y-1 flex flex-col">
                        <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                          {/* Temperature - 3/4 width */}
                          <div className="flex-[3] space-y-0.5 flex flex-col">
                            <div className="flex items-center gap-0.5">
                              <Label className="text-[10px] sm:text-xs font-medium">Temperature</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Control creativity: 0 = strict/deterministic, 1 = creative/random</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <ToggleGroup
                              type="single"
                              value={temperature}
                              onValueChange={(value) => {
                                if (value) setTemperature(value);
                              }}
                              className="h-6 sm:h-7 w-full"
                              variant="outline"
                              size="sm"
                              disabled
                            >
                              <ToggleGroupItem value="0" aria-label="0" className="flex-1 text-[10px] sm:text-xs">
                                0
                              </ToggleGroupItem>
                              <ToggleGroupItem value="0.25" aria-label="0.25" className="flex-1 text-[10px] sm:text-xs">
                                0.25
                              </ToggleGroupItem>
                              <ToggleGroupItem value="0.5" aria-label="0.5" className="flex-1 text-[10px] sm:text-xs">
                                0.5
                              </ToggleGroupItem>
                              <ToggleGroupItem value="0.75" aria-label="0.75" className="flex-1 text-[10px] sm:text-xs">
                                0.75
                              </ToggleGroupItem>
                              <ToggleGroupItem value="1" aria-label="1" className="flex-1 text-[10px] sm:text-xs">
                                1
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                          
                          {/* Quality - 1/4 width */}
                          <div className="flex-[1] space-y-0.5 flex flex-col">
                            <div className="flex items-center gap-0.5">
                              <Label className="text-[10px] sm:text-xs font-medium">Quality</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Image quality setting</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Select value={quality} onValueChange={setQuality} disabled>
                              <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard" className="text-[10px] sm:text-xs">Standard</SelectItem>
                                <SelectItem value="high" className="text-[10px] sm:text-xs">High</SelectItem>
                                <SelectItem value="ultra" className="text-[10px] sm:text-xs">Ultra</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Style Transfer (1/4 width) */}
                    <div className="flex-[1] flex flex-col">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-[10px] sm:text-xs font-medium whitespace-nowrap cursor-help">Style Ref</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload an image to transfer its style</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative w-full flex-1 min-h-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-full w-full p-0"
                          disabled
                        >
                          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Before/After Slider */}
          <div className="flex-[3] flex items-center justify-center min-h-0">
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

        {/* Feature Pills */}
        <div className="text-center pb-8">
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
