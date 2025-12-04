'use client';

import { Clock, Zap, CheckCircle2, Send, Video as VideoIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';

interface Slide21VideoProps {
  galleryRenders?: GalleryItemWithDetails[];
  onVideoComplete?: () => void;
}

export function Slide21Video({ galleryRenders = [], onVideoComplete }: Slide21VideoProps) {
  const [typingText, setTypingText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; type: 'user' | 'assistant'; videoUrl?: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoZooming, setVideoZooming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use most popular video from gallery (already sorted by popularity from demo page)
  // Take first video that is completed and has output
  const latestVideo = galleryRenders
    .filter(r => 
      r.render?.outputUrl && 
      r.render?.status === 'completed' && 
      r.render?.type === 'video'
    )[0]; // First item is most popular (already sorted)

  const currentPrompt = latestVideo?.render?.prompt || 'Create a video showing the transformation';

  // Helper function to truncate text at last period
  const truncateAtLastPeriod = (text: string): string => {
    const lastPeriodIndex = text.lastIndexOf('.');
    if (lastPeriodIndex === -1) return text;
    return text.substring(0, lastPeriodIndex + 1);
  };

  // Auto-type prompt when component mounts
  useEffect(() => {
    if (!currentPrompt) return;
    
    // Clear old messages
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
        // After typing completes, send as user message
        setTimeout(() => {
          setIsTyping(false);
          setMessages([{
            id: `user-msg-${Date.now()}`,
            text: truncatedPrompt,
            type: 'user'
          }]);
          setTypingText('');
          
          // After user message, send assistant video response
          setTimeout(() => {
            if (latestVideo?.render?.outputUrl) {
              setMessages(prev => [...prev, {
                id: `assistant-msg-${Date.now()}`,
                text: 'Here\'s your video!',
                type: 'assistant',
                videoUrl: latestVideo.render.outputUrl
              }]);
              setIsVideoPlaying(true);
            }
          }, 1000);
        }, 500);
      }
    }, 30); // Typing speed: 30ms per character

    return () => clearInterval(typingInterval);
  }, []);

  // Handle video zoom and fullscreen
  useEffect(() => {
    if (isVideoPlaying && latestVideo?.render?.outputUrl) {
      // Start zooming after video starts playing (like a floating bubble)
      const zoomTimer = setTimeout(() => {
        setVideoZooming(true);
      }, 1500); // Start zooming after 1.5 seconds

      // Video will loop until slide ends (handled by slideshow duration)
      // No need to call onVideoComplete here since video loops
    }
  }, [isVideoPlaying, latestVideo]);

  const hasUploadedImage = !!latestVideo?.render?.uploadedImageUrl;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-r from-background via-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-8 relative z-10 h-full flex flex-col">
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
                    {msg.type === 'assistant' && msg.videoUrl ? (
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
                        />
                      </div>
                    ) : (
                      <div className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%]",
                        msg.type === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-foreground"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    )}
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
                        <VideoIcon className="h-3 w-3" />
                        <span>Video</span>
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

          {/* Right Column - Text Message */}
          {!videoZooming && (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                  Generate{' '}
                  <span className="text-primary inline-block">Video Renders</span>
                  {' '}in Seconds
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* Main Message - Only show when video is not zooming */}
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

