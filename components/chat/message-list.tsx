'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Copy, Pencil, ChevronUp, ChevronDown, Sparkles, ImageIcon, Video, MessageSquare, Zap, Globe, Wand2, BookOpen, Upload, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { shouldUseRegularImg } from '@/lib/utils/storage-url';
import { handleImageErrorWithFallback } from '@/lib/utils/cdn-fallback';
import { getVersionNumber, getRenderById } from '@/lib/utils/chain-helpers';
import { logger } from '@/lib/utils/logger';
import type { Message } from './types/chat-types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import type { Render } from '@/lib/types/render';

// TruncatedMessage component
function TruncatedMessage({ 
  content, 
  maxLines = 4, 
  className = "" 
}: { 
  content: string; 
  maxLines?: number; 
  className?: string; 
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldTruncate, setShouldTruncate] = React.useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight) || 20;
      const elementHeight = textRef.current.offsetHeight;
      const maxHeight = lineHeight * maxLines;
      
      setShouldTruncate(elementHeight > maxHeight);
    }
  }, [content, maxLines]);

  const shouldTruncateByLength = content.length > 200;
  const needsTruncation = shouldTruncate || shouldTruncateByLength;

  if (!needsTruncation) {
    return <p className={className}>{content}</p>;
  }

  return (
    <div>
      <p 
        ref={textRef}
        className={className}
        style={!isExpanded ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        } : {}}
      >
        {content}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-1 h-6 px-2 text-xs"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Show more
          </>
        )}
      </Button>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  currentRender: Render | null;
  onRenderSelect: (render: Render) => void;
  isGenerating: boolean;
  progress: number;
  chain?: RenderChainWithRenders;
  onInputValueChange?: (value: string) => void;
  onSetCurrentRender?: (render: Render) => void;
  onSetMobileView?: (view: 'chat' | 'render') => void;
  onSetIsVideoMode?: (isVideo: boolean) => void;
  onSetUploadedFile?: (file: File | null) => void;
  userSelectedRenderIdRef?: React.MutableRefObject<string | null>;
}

export function MessageList({
  messages,
  currentRender,
  onRenderSelect,
  isGenerating,
  progress,
  chain,
  onInputValueChange,
  onSetCurrentRender,
  onSetMobileView,
  onSetIsVideoMode,
  onSetUploadedFile,
  userSelectedRenderIdRef,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRenderClick = (render: Render) => {
    const renderToSet = getRenderById(chain?.renders, render.id) || render;
    if (userSelectedRenderIdRef) {
      userSelectedRenderIdRef.current = renderToSet.id;
    }
    if (onSetCurrentRender) {
      onSetCurrentRender(renderToSet);
    }
    onRenderSelect(renderToSet);
    if (onSetMobileView) {
      onSetMobileView('render');
    }
    
    // If it's a video, switch to video mode on render tab
    if (renderToSet?.type === 'video' && onSetIsVideoMode && onSetUploadedFile) {
      onSetIsVideoMode(true);
      // Load the video as uploaded file for further editing
      if (render.outputUrl) {
        fetch(render.outputUrl)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], `video-${Date.now()}.mp4`, { type: 'video/mp4' });
            onSetUploadedFile(file);
          })
          .catch(error => {
            logger.error('Failed to load video for editing:', error);
          });
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-1 sm:p-1 space-y-1 sm:space-y-1 min-h-0">
      {messages.length === 0 ? (
        <div className="max-w-4xl mx-auto p-4 sm:p-2 space-y-2">
          {/* Welcome Screen - Tutorial Grid */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1 mb-6">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold">Welcome to Renderiq Chat</h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Learn about all the powerful settings and controls available to create stunning renders
            </p>
          </div>

          {/* Tutorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2">
            {/* Model Selector */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Model Selector</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Select AI model for images/videos. Different capabilities, quality, and costs. Auto-filters by mode.
                </p>
              </CardContent>
            </Card>

            {/* Mode Toggle */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Mode Toggle</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Toggle between Image (static) and Video (animated) modes.
                </p>
              </CardContent>
            </Card>

            {/* Environment */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Environment</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Set weather/lighting: Sunny, Overcast, Rainy, Sunset, Sunrise, Night, Foggy, Cloudy.
                </p>
              </CardContent>
            </Card>

            {/* Effect */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Effect</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Visual style: Wireframe, Photoreal, Illustration, Sketch, Watercolor, Line Art, Concept Art, Architectural, Technical.
                </p>
              </CardContent>
            </Card>

            {/* Temperature */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Temperature</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Creativity: 0 = consistent, 1 = varied. Default 0.5.
                </p>
              </CardContent>
            </Card>

            {/* Quality */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Quality</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Standard (1K): 5 credits | High (2K): 10 credits | Ultra (4K): 15 credits. Options vary by model.
                </p>
              </CardContent>
            </Card>

            {/* Style Transfer */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Style Reference</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Upload image to transfer its style to your render.
                </p>
              </CardContent>
            </Card>

            {/* Privacy Toggle */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Privacy Toggle</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Public: Visible to others (Free default). Private: Only you (Pro feature).
                </p>
              </CardContent>
            </Card>

            {/* Gallery & Builder */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Gallery & Builder</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Prompts: Browse examples. Builder: Create structured prompts.
                </p>
              </CardContent>
            </Card>

            {/* Upload & Mentions */}
            <Card className="p-4">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-xs sm:text-sm">Upload & Mentions</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Upload: Attach reference images or animate in video mode. @ Mentions: Type @ to reference previous renders.
                </p>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="p-4 bg-primary/5 border-primary/20 md:col-span-2">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base sm:text-lg">Ready to Start?</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Type your prompt, adjust settings, and click Generate. Refine renders in the conversation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {logger.log('🎨 MessageList: Rendering messages list', {
            totalMessages: messages.length,
            userMessages: messages.filter(m => m.type === 'user').length,
            assistantMessages: messages.filter(m => m.type === 'assistant').length,
          })}
          
          {messages.map((message, index) => (
            <div
              key={`${message.id}-${message.timestamp.getTime()}`}
              className={cn(
                'flex flex-col',
                message.type === 'user' ? 'items-end' : 'items-start'
              )}
            >
              {/* Sender name above message */}
              <div className={cn(
                'text-[10px] sm:text-xs text-muted-foreground mb-1 px-1',
                message.type === 'user' ? 'text-right' : 'text-left flex items-center gap-1.5'
              )}>
                {message.type === 'assistant' && (
                  <>
                    <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src="/logo.svg"
                        alt="Renderiq"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>Renderiq</span>
                  </>
                )}
                {message.type === 'user' && 'You'}
              </div>
              
              <div
                className={cn(
                  'max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3',
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground animate-in slide-in-from-right-5 duration-300'
                    : 'bg-muted animate-in slide-in-from-left-5 duration-300',
                  message.type === 'assistant' && message.render && 'max-w-[98%] sm:max-w-[95%]',
                  'w-full min-w-0 overflow-hidden'
                )}
              >
                {/* User message content */}
                {message.type === 'user' ? (
                  <div className="flex items-start justify-between gap-2 group">
                    <div className="flex-1">
                      <TruncatedMessage 
                        content={message.content} 
                        className="text-xs sm:text-sm" 
                        maxLines={4}
                      />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast.success('Message copied to clipboard');
                        }}
                        className="h-6 w-6 p-0"
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (onInputValueChange) {
                            onInputValueChange(message.content);
                            toast.info('Message loaded into input. Modify and send.');
                          }
                        }}
                        className="h-6 w-6 p-0"
                        title="Edit and resend"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <TruncatedMessage 
                    content={message.content} 
                    className="text-xs sm:text-sm" 
                    maxLines={4}
                  />
                )}
                
                {/* Show uploaded image in user message */}
                {message.uploadedImage && message.uploadedImage.previewUrl && (
                  <div className="mt-2">
                    <div className="relative w-24 h-16 sm:w-32 sm:h-20 bg-muted/20 rounded-lg overflow-hidden border border-white/20">
                      {shouldUseRegularImg(message.uploadedImage.previewUrl) ? (
                        <img
                          src={message.uploadedImage.previewUrl}
                          alt="Uploaded image"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const originalUrl = message.uploadedImage!.previewUrl;
                            const fallbackUrl = handleImageErrorWithFallback(originalUrl, e);
                            if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                              img.src = fallbackUrl;
                            } else {
                              img.src = '/placeholder-image.jpg';
                            }
                          }}
                        />
                      ) : (
                        <Image
                          src={message.uploadedImage.previewUrl}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/70 mt-1">
                      {message.uploadedImage.persistedUrl ? 'Using uploaded image' : 'Working with uploaded image'}
                    </p>
                  </div>
                )}
                
                {/* Generating indicator */}
                {message.isGenerating && (
                  <div className="mt-3 space-y-3">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
                        style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Render display */}
                {message.render && (
                  <div className="mt-2 w-full max-w-full overflow-hidden">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        Version {getVersionNumber(message.render, chain?.renders) || index + 1}
                      </span>
                    </div>
                    <div 
                      className="relative w-full max-w-full aspect-video rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-muted animate-in fade-in-0 zoom-in-95 duration-500"
                      onClick={() => handleRenderClick(message.render!)}
                    >
                      {message.render.type === 'video' ? (
                        message.render.outputUrl ? (
                          <video
                            key={message.render.id + '-' + message.render.outputUrl}
                            src={message.render.outputUrl}
                            className="w-full h-full object-cover"
                            controls
                            loop
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )
                      ) : message.render.outputUrl ? (
                        shouldUseRegularImg(message.render.outputUrl) ? (
                          <img
                            key={message.render.id + '-' + message.render.outputUrl}
                            src={message.render.outputUrl || '/placeholder-image.jpg'}
                            alt="Generated render"
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const originalUrl = message.render!.outputUrl;
                              const fallbackUrl = handleImageErrorWithFallback(originalUrl || '', e);
                              if (fallbackUrl && fallbackUrl !== '/placeholder-image.jpg') {
                                img.src = fallbackUrl;
                              } else {
                                img.src = '/placeholder-image.jpg';
                              }
                            }}
                          />
                        ) : (
                          <Image
                            key={message.render.id + '-' + message.render.outputUrl}
                            src={message.render.outputUrl}
                            alt="Generated render"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 95vw"
                            loading="lazy"
                            onError={(e) => {
                              logger.error('Failed to load image:', message.render!.outputUrl);
                            }}
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

