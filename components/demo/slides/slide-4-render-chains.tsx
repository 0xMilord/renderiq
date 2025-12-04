'use client';

import { useState, useEffect } from 'react';
import { GitBranch, MessageSquare, User, Bot, Sparkles } from 'lucide-react';
import { useDemoData } from '@/components/demo/demo-data-context';
import Image from 'next/image';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  version?: string;
  renderId?: string;
  renderUrl?: string;
  timestamp: Date;
}

export function Slide4RenderChains() {
  const { longestChains } = useDemoData();
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [highlightedVersion, setHighlightedVersion] = useState<string | null>(null);

  // Use most popular chain (already sorted by popularity from demo page)
  // Take first chain that has renders
  const longestChain = longestChains.length > 0 
    ? longestChains.find(chain => chain.renders && chain.renders.length > 0) || null
    : null;

  // Convert chain renders to chat messages
  const chatMessages = longestChain?.renders?.map((render, index) => {
    const version = `v${index + 1}`;
    return [
      {
        id: `user-${render.id}`,
        type: 'user' as const,
        text: render.prompt || 'Generate a render',
        version,
        timestamp: render.createdAt || new Date(),
      },
      {
        id: `assistant-${render.id}`,
        type: 'assistant' as const,
        text: `Here's your ${version} render!`,
        version,
        renderId: render.id,
        renderUrl: render.outputUrl || undefined,
        timestamp: render.createdAt || new Date(),
      },
    ];
  }).flat() || [];

  // Animate messages appearing sequentially
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        if (prev >= chatMessages.length) {
          // Reset after showing all messages
          setTimeout(() => {
            setVisibleMessages(0);
            setHighlightedVersion(null);
          }, 3000);
          return prev;
        }
        
        const nextMessage = chatMessages[prev];
        if (nextMessage?.version) {
          setHighlightedVersion(nextMessage.version);
        }
        
        return prev + 1;
      });
    }, 1500); // Show next message every 1.5 seconds

    return () => clearInterval(interval);
  }, [chatMessages.length]);

  // Git graph layout for versions
  const versions = longestChain?.renders?.slice(0, 6).map((render, index) => ({
    id: `v${index + 1}`,
    label: `v${index + 1}`,
    render,
    position: index,
  })) || [];

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="container mx-auto max-w-[95vw] h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 mb-2 sm:mb-3">
            <GitBranch className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground">
              Render Chains & Version Control
            </h2>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
            Iterate with Context - Reference Any Version
          </p>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-0">
          {/* Left Column - Chat Interface */}
          <div className="bg-card/90 backdrop-blur-md rounded-xl border-2 border-border shadow-xl flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 bg-muted/50">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Chat History</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No chat history available
                </div>
              ) : (
                chatMessages.slice(0, visibleMessages).map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 sm:p-4 max-w-[80%] ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      } ${
                        highlightedVersion === message.version
                          ? 'ring-2 ring-primary ring-offset-2'
                          : ''
                      }`}
                    >
                      {message.version && (
                        <div className="text-xs font-bold mb-1 opacity-80">
                          Version {message.version}
                        </div>
                      )}
                      <p className="text-sm sm:text-base">{message.text}</p>
                      {message.renderUrl && (
                        <div className="mt-2 rounded overflow-hidden border border-border/50">
                          <Image
                            src={message.renderUrl}
                            alt={`Render ${message.version}`}
                            width={200}
                            height={150}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Git Graph Layout */}
          <div className="bg-card/90 backdrop-blur-md rounded-xl border-2 border-border shadow-xl flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 bg-muted/50">
              <GitBranch className="h-5 w-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Version Graph</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {versions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No versions available
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line connecting versions */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/30" />
                  
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`relative mb-6 sm:mb-8 transition-all duration-500 ${
                        highlightedVersion === version.id
                          ? 'scale-105 opacity-100'
                          : 'opacity-70'
                      }`}
                    >
                      {/* Version node */}
                      <div className="flex items-start gap-4">
                        {/* Git graph node */}
                        <div className="relative z-10">
                          <div
                            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-300 ${
                              highlightedVersion === version.id
                                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg'
                                : 'bg-card border-primary/50 text-primary'
                            }`}
                          >
                            {version.label}
                          </div>
                          {/* Connection line to next version */}
                          {index < versions.length - 1 && (
                            <div className="absolute left-1/2 top-full w-0.5 h-6 sm:h-8 bg-primary/30 transform -translate-x-1/2" />
                          )}
                        </div>

                        {/* Version card */}
                        <div
                          className={`flex-1 bg-muted/50 rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 ${
                            highlightedVersion === version.id
                              ? 'border-primary shadow-lg'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm sm:text-base font-bold text-foreground">
                              {version.label}
                            </span>
                            <code className="text-xs sm:text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded">
                              @{version.label.toLowerCase()}
                            </code>
                          </div>
                          {version.render?.outputUrl && (
                            <div className="rounded overflow-hidden border border-border">
                              <Image
                                src={version.render.outputUrl}
                                alt={version.label}
                                width={300}
                                height={200}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}
                          {version.render?.prompt && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                              {version.render.prompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Example Usage */}
        <div className="mt-4 sm:mt-6 text-center flex-shrink-0">
          <div className="inline-block bg-gradient-to-r from-muted/80 to-muted/60 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border-2 border-primary/30 shadow-xl">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 font-medium">
              Example:
            </p>
            <code className="text-sm sm:text-base md:text-lg font-mono font-semibold block text-primary">
              "Make @v2 more modern with glass windows"
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
