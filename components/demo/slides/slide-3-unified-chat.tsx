'use client';

import { useState, useEffect } from 'react';
import { useDemoData } from '@/components/demo/demo-data-context';
import { MessageSquare, Image as ImageIcon, Video, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

interface Slide3UnifiedChatProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
}

interface DemoMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  render?: {
    id: string;
    type: 'image' | 'video';
    outputUrl: string;
    uploadedImageUrl?: string;
    prompt: string;
  };
  timestamp: Date;
}

export function Slide3UnifiedChat({ galleryRenders = [], longestChains = [] }: Slide3UnifiedChatProps) {
  const { projects, chains } = useDemoData();
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Use most popular chain (already sorted by popularity from demo page)
  // Take first chain that has renders
  const demoChain = longestChains
    .filter(c => c.renders && c.renders.length > 0)[0]; // First item is most popular (already sorted)

  // Build messages from chain renders
  const allMessages: DemoMessage[] = [];
  
  if (demoChain?.renders) {
    demoChain.renders
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0))
      .forEach((render) => {
        // User message with prompt
        allMessages.push({
          id: `user-${render.id}`,
          type: 'user',
          content: render.prompt || 'Generate a render',
          timestamp: render.createdAt,
        });

        // Assistant message with render
        if (render.status === 'completed' && render.outputUrl) {
          allMessages.push({
            id: `assistant-${render.id}`,
            type: 'assistant',
            content: '',
            render: {
              id: render.id,
              type: render.type as 'image' | 'video',
              outputUrl: render.outputUrl,
              uploadedImageUrl: render.uploadedImageUrl || undefined,
              prompt: render.prompt,
            },
            timestamp: render.updatedAt,
          });
        }
      });
  }

  // Sequentially show messages
  useEffect(() => {
    if (!isAnimating || allMessages.length === 0) return;
    if (currentMessageIndex >= allMessages.length) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisibleMessages((prev) => [...prev, allMessages[currentMessageIndex]]);
      setCurrentMessageIndex((prev) => prev + 1);
    }, 1500); // Show next message every 1.5 seconds

    return () => clearTimeout(timer);
  }, [currentMessageIndex, allMessages, isAnimating]);

  // Reset animation when component mounts or chain changes
  useEffect(() => {
    setVisibleMessages([]);
    setCurrentMessageIndex(0);
    setIsAnimating(true);
  }, [demoChain?.id]);

  if (!demoChain || allMessages.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Unified Chat Interface</h2>
          <p className="text-muted-foreground">No demo data available. Please add renders to the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-6 sm:p-8 overflow-hidden">
      <div className="container mx-auto max-w-7xl h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground">
              Unified Chat Interface
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Chat naturally with AI to generate renders. See your conversation and results in real-time.
          </p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col bg-card rounded-xl border-2 border-border shadow-2xl overflow-hidden min-h-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center gap-3 flex-shrink-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Renderiq"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Renderiq Chat</h3>
              <p className="text-xs text-muted-foreground">{demoChain.name || 'Demo Chain'}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
            {visibleMessages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Starting conversation...</p>
                </div>
              </div>
            )}

            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-lg max-w-[80%] sm:max-w-[70%]",
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground px-4 py-3'
                      : 'bg-muted px-4 py-3'
                  )}
                >
                  {message.type === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  ) : message.render ? (
                    <div className="space-y-2">
                      {message.render.uploadedImageUrl && message.render.outputUrl ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-border">
                          <div className="relative aspect-video">
                            <Image
                              src={message.render.uploadedImageUrl}
                              alt="Before"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative w-full h-full">
                                <Image
                                  src={message.render.outputUrl}
                                  alt="After"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                              After
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                              Before
                            </div>
                          </div>
                        </div>
                      ) : message.render.outputUrl ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-border">
                          <div className="relative aspect-video">
                            {message.render.type === 'video' ? (
                              <video
                                src={message.render.outputUrl}
                                controls
                                className="w-full h-full object-cover"
                                playsInline
                              />
                            ) : (
                              <Image
                                src={message.render.outputUrl}
                                alt="Generated render"
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                        </div>
                      ) : null}
                      {message.render.prompt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Generated from: "{message.render.prompt.substring(0, 50)}..."
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">Generating...</p>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isAnimating && visibleMessages.length > 0 && (
              <div className="flex justify-start gap-3 animate-pulse">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area (Static for Demo) */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">
                Type your prompt to generate renders...
              </span>
              <div className="flex gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
