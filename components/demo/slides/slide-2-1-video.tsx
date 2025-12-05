'use client';

import { Clock, Zap, CheckCircle2, Video as VideoIcon, Upload, Image as ImageIcon, Lock, Globe, HelpCircle, Plus, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

interface Slide21VideoProps {
  galleryRenders?: GalleryItemWithDetails[];
  onVideoComplete?: () => void;
}

export function Slide21Video({ galleryRenders = [], onVideoComplete }: Slide21VideoProps) {
  const [typingText, setTypingText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: 'user' | 'assistant'; videoUrl?: string; uploadedImageUrl?: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoZooming, setVideoZooming] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Video mode state
  const [isVideoMode] = useState(true); // Always video mode for this slide
  const [isPublic, setIsPublic] = useState(true);
  const [environment, setEnvironment] = useState('none');
  const [effect, setEffect] = useState('none');
  const [videoDuration, setVideoDuration] = useState(8);
  const [quality, setQuality] = useState('standard');
  const [videoKeyframes] = useState<Array<{ id: string; imageData: string; imageType: string }>>([]);
  const [videoLastFrame] = useState<{ imageData: string; imageType: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Use most popular video from gallery (already sorted by popularity from demo page)
  // Filter for videos that are completed and have output, then take the first one (most popular)
  const latestVideo = galleryRenders
    .filter(r => 
      r.render?.outputUrl && 
      r.render?.status === 'completed' && 
      r.render?.type === 'video'
    )[0]; // First item is most popular (already sorted by popularity)

  const currentPrompt = latestVideo?.render?.prompt || 'Create a video showing the transformation';

  // Helper function to truncate text at last period
  const truncateAtLastPeriod = (text: string): string => {
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex === -1) return text;
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

  // Auto-type prompt when component mounts
  useEffect(() => {
    if (!currentPrompt || !latestVideo) return;
    
    // Clear old messages
    setMessages([]);
    setShowShimmer(false);
    
    // Truncate prompt at last period for full message
    const fullPrompt = truncateAtLastPeriod(currentPrompt);
    // Get text for 3 lines in textarea (limited display)
    const textForTextarea = getTextForThreeLines(fullPrompt);
    
    setIsTyping(true);
    setTypingText('');
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      // Only type up to 3 lines worth in the textarea
      if (charIndex < textForTextarea.length) {
        setTypingText(textForTextarea.substring(0, charIndex + 1));
        charIndex++;
        // Show shimmer placeholder while typing
        if (charIndex > 5) {
          setShowShimmer(true);
        }
      } else {
        clearInterval(typingInterval);
        // After typing 3 lines, immediately send full prompt as message
        setTimeout(() => {
          setIsTyping(false);
          setShowShimmer(false);
          setMessages([{
            id: `user-msg-${Date.now()}`,
            text: fullPrompt, // Full prompt in message bubble
            type: 'user',
            uploadedImageUrl: latestVideo?.render?.uploadedImageUrl
          }]);
          setTypingText('');
          
          // Show video immediately after user message
          if (latestVideo?.render?.outputUrl) {
            setMessages(prev => [...prev, {
              id: `assistant-msg-${Date.now()}`,
              text: 'Here\'s your video!',
              type: 'assistant',
              videoUrl: latestVideo.render.outputUrl
            }]);
            setIsVideoPlaying(true);
          }
          
          // Set preview URL for start frame if uploaded image exists
          if (latestVideo?.render?.uploadedImageUrl) {
            setPreviewUrl(latestVideo.render.uploadedImageUrl);
          }
        }, 300); // Reduced delay to show video ASAP
      }
    }, 30); // Typing speed: 30ms per character

    return () => clearInterval(typingInterval);
  }, [currentPrompt, latestVideo]);

  // Handle video zoom and fullscreen
  useEffect(() => {
    if (isVideoPlaying && latestVideo?.render?.outputUrl) {
      // Start zooming after video starts playing (like a floating bubble)
      setTimeout(() => {
        setVideoZooming(true);
      }, 1500); // Start zooming after 1.5 seconds

      // Video will loop until slide ends (handled by slideshow duration)
      // No need to call onVideoComplete here since video loops
    }
  }, [isVideoPlaying, latestVideo?.render?.outputUrl]);

  return (
    <div className="relative w-full h-full flex flex-col bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-animation {
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
          background-position: 0% 0%;
        }
      `}} />
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Generate Video Renders
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              Generate 4-8 second video renders in seconds. AI-powered instant results.
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
        {/* Main Content - 2 Column Layout: Chat on Left, Video on Right */}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex",
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {msg.type === 'user' && (
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
                        <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    )}
                    {msg.type === 'assistant' && (
                      <>
                        {msg.videoUrl ? (
                          <div className={cn(
                            "rounded-lg overflow-hidden transition-all duration-1000 ease-out",
                            videoZooming 
                              ? "fixed inset-0 z-50 m-0 rounded-none" 
                              : "max-w-[80%] bg-muted"
                          )}>
                            <video
                              ref={videoRef}
                              src={msg.videoUrl}
                              autoPlay
                              loop={true}
                              muted
                              playsInline
                              className={cn(
                                "w-full h-auto",
                                videoZooming ? "h-full w-full object-cover" : ""
                              )}
                              onLoadedData={() => {
                                // Ensure video plays
                                if (videoRef.current) {
                                  videoRef.current.play().catch(() => {
                                    // Auto-play might fail, but that's okay
                                  });
                                }
                              }}
                              onEnded={() => {
                                // Restart video immediately when it ends to ensure continuous looping
                                if (videoRef.current) {
                                  videoRef.current.currentTime = 0;
                                  videoRef.current.play().catch(() => {});
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="bg-muted text-foreground rounded-lg px-4 py-2 max-w-[80%]">
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                
                {/* Shimmer placeholder while typing */}
                {showShimmer && !isVideoPlaying && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-muted rounded-lg overflow-hidden">
                      <div className="relative aspect-video w-full bg-gradient-to-r from-muted via-primary/10 to-muted overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-animation">
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2">
                            <VideoIcon className="h-8 w-8 text-muted-foreground/50 animate-pulse" />
                            <p className="text-xs text-muted-foreground/50">Generating video...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area - Matching Unified Chat Interface Video Mode */}
              <div className="p-2 sm:p-3 border-t border-border flex-shrink-0 space-y-2">
                {/* Top Row: Video Mode Badge and Private/Public Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isVideoMode && (
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 flex items-center gap-1">
                        <VideoIcon className="h-3 w-3" />
                        Video Mode
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="privacy-toggle" className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
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
                </div>
                
                {/* Prompt Input */}
                <div className="flex gap-1 sm:gap-2">
                  <div className="relative flex-1 flex flex-col">
                    <Textarea
                      value={typingText}
                      readOnly
                      placeholder="Describe how you want to animate this image..."
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
                
                {/* Style Settings - 2 columns: Environment/Effect/Duration/Quality (3/4) and Style Transfer (1/4) */}
                <div>
                  <div className="flex gap-1.5 sm:gap-2 items-stretch">
                    {/* Left Column: Mode/Environment/Effect and Duration/Quality (3/4 width, 2 rows) */}
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
                              className={cn(
                                "h-6 sm:h-7 w-6 sm:w-7 p-0",
                                isVideoMode && "bg-primary text-primary-foreground"
                              )}
                              title="Video Mode"
                              disabled
                            >
                              <VideoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                              <SelectItem value="sketch" className="text-[10px] sm:text-xs">Sketch</SelectItem>
                              <SelectItem value="watercolor" className="text-[10px] sm:text-xs">Watercolor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: Duration and Quality (for video mode) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                        {/* Video Duration */}
                        <div className="flex-1 space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Duration</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Duration of the generated video (4, 6, or 8 seconds)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Select value={videoDuration.toString()} onValueChange={(value) => setVideoDuration(parseInt(value) as 4 | 6 | 8)} disabled>
                            <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4" className="text-[10px] sm:text-xs">4s</SelectItem>
                              <SelectItem value="6" className="text-[10px] sm:text-xs">6s</SelectItem>
                              <SelectItem value="8" className="text-[10px] sm:text-xs">8s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Quality */}
                        <div className="flex-1 space-y-0.5 flex flex-col">
                          <div className="flex items-center gap-0.5">
                            <Label className="text-[10px] sm:text-xs font-medium">Quality</Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Set rendering quality and detail level</p>
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

                {/* Video Keyframe Timeline - Only show in video mode */}
                {isVideoMode && (
                  <div className="mt-2 border-t pt-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                      {/* Start Frame */}
                      <div className="flex-1 space-y-0.5 flex flex-col">
                        <div className="flex items-center gap-0.5">
                          <Label className="text-[10px] sm:text-xs font-medium">Start</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>First frame of the video (from uploaded image)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative w-full aspect-square rounded border overflow-hidden bg-muted max-w-[75%] mx-auto">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt="Start frame"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Keyframes (K1, K2, K3) */}
                      {[0, 1, 2].map((index) => {
                        const keyframe = videoKeyframes[index];
                        return (
                          <div key={index} className="flex-1 space-y-0.5 flex flex-col">
                            <div className="flex items-center gap-0.5">
                              <Label className="text-[10px] sm:text-xs font-medium">K{index + 1}</Label>
                            </div>
                            <div className="relative w-full aspect-square rounded border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity max-w-[75%] mx-auto">
                              {keyframe ? (
                                <Image
                                  src={`data:${keyframe.imageType};base64,${keyframe.imageData}`}
                                  alt={`Keyframe ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* End Frame */}
                      <div className="flex-1 space-y-0.5 flex flex-col">
                        <div className="flex items-center gap-0.5">
                          <Label className="text-[10px] sm:text-xs font-medium">End</Label>
                        </div>
                        <div className="relative w-full aspect-square rounded border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity max-w-[75%] mx-auto">
                          {videoLastFrame ? (
                            <Image
                              src={`data:${videoLastFrame.imageType};base64,${videoLastFrame.imageData}`}
                              alt="End frame"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Empty or placeholder */}
          {!videoZooming && (
            <div className="flex-1 flex items-center justify-center min-h-0">
            </div>
          )}
        </div>

        {/* Feature Pills - Only show when video is not zooming */}
        {!videoZooming && (
          <div className="text-center pb-8">
            {/* Feature Pills */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: Clock, text: '4-8 Second Videos', color: 'text-blue-500' },
                { icon: Zap, text: 'Instant Results', color: 'text-primary' },
                { icon: CheckCircle2, text: 'AI-Powered', color: 'text-green-500' },
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
        )}
      </div>
    </div>
  );
}

