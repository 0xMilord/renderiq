'use client';

import { useState, useEffect } from 'react';
import { GitBranch, MessageSquare, User, Bot, Sparkles, Upload, Image as ImageIcon, Video, Lock, Globe, HelpCircle } from 'lucide-react';
import { useDemoData } from '@/components/demo/demo-data-context';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  version?: string;
  renderId?: string;
  renderUrl?: string;
  uploadedImageUrl?: string;
  timestamp: Date;
}

export function Slide4RenderChains() {
  const { longestChains } = useDemoData();
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [highlightedVersion, setHighlightedVersion] = useState<string | null>(null);
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
        renderId: render.id,
        renderUrl: render.uploadedImageUrl || undefined, // Use uploaded image for user message
        timestamp: render.createdAt || new Date(),
      },
      {
        id: `assistant-${render.id}`,
        type: 'assistant' as const,
        text: `Here's your ${version} render!`,
        version,
        renderId: render.id,
        renderUrl: render.outputUrl || undefined, // Use output image for assistant message
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
    <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Render Chains & Version Control
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              Iterate with context. Reference any version and track your design evolution.
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
      <div className="container mx-auto max-w-[95vw] flex-1 flex flex-col min-h-0 p-4 sm:p-6">

        {/* Main Content - 1/4 Chat, 3/4 Versions */}
        <div className="flex-1 grid grid-cols-4 gap-4 sm:gap-6 min-h-0">
          {/* Left Column - Chat Interface (1/4 width) */}
          <div className="col-span-1 bg-card rounded-lg border border-border shadow-lg h-full flex flex-col overflow-hidden">
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
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No chat history available
                </div>
              ) : (
                chatMessages.slice(0, visibleMessages).map((message) => {
                  const isExpanded = expandedMessages.has(message.id);
                  const shouldTruncate = message.text.length > 150;
                  
                  return (
                    <div key={message.id} className={cn(
                      "flex",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mr-2">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-lg px-4 py-3 max-w-[85%] space-y-2",
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                        highlightedVersion === message.version
                          ? 'ring-2 ring-primary ring-offset-2'
                          : ''
                      )}>
                        {message.version && (
                          <div className="text-xs font-bold mb-1 opacity-80">
                            Version {message.version}
                          </div>
                        )}
                        {message.type === 'user' && (message.renderUrl || message.uploadedImageUrl) && (
                          <div className="relative w-full max-w-[200px] rounded-lg overflow-hidden border-2 border-primary-foreground/20 mb-2">
                            <div className="relative aspect-square w-full">
                              <Image
                                src={message.renderUrl || message.uploadedImageUrl || ''}
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
                            {message.text}
                          </p>
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleMessageExpand(message.id)}
                              className={cn(
                                "text-xs underline font-medium",
                                message.type === 'user' 
                                  ? "text-primary-foreground/80 hover:text-primary-foreground"
                                  : "text-muted-foreground/80 hover:text-foreground"
                              )}
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                        {message.type === 'assistant' && message.renderUrl && (
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
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 ml-2">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area - Matching Slide 2 */}
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
                    value=""
                    readOnly
                    placeholder="Describe your vision..."
                    className="h-[60px] sm:h-[70px] resize-none w-full text-xs sm:text-sm"
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
                            <SelectItem value="sketch" className="text-[10px] sm:text-xs">Sketch</SelectItem>
                            <SelectItem value="watercolor" className="text-[10px] sm:text-xs">Watercolor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 2: Temperature and Quality */}
                    <div className="flex gap-1.5 sm:gap-2">
                      {/* Temperature */}
                      <div className="space-y-1 flex flex-col flex-1">
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] sm:text-xs font-medium">Temperature</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Control creativity vs accuracy (0-100%)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={temperature} onValueChange={setTemperature} disabled>
                          <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0" className="text-[10px] sm:text-xs">0% (Most Accurate)</SelectItem>
                            <SelectItem value="0.25" className="text-[10px] sm:text-xs">25%</SelectItem>
                            <SelectItem value="0.5" className="text-[10px] sm:text-xs">50% (Balanced)</SelectItem>
                            <SelectItem value="0.75" className="text-[10px] sm:text-xs">75%</SelectItem>
                            <SelectItem value="1.0" className="text-[10px] sm:text-xs">100% (Most Creative)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quality */}
                      <div className="space-y-1 flex flex-col flex-1">
                        <div className="flex items-center gap-1">
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
            </div>
          </div>

          {/* Right Column - Version Cards (3/4 width) */}
          <div className="col-span-3 bg-card/90 backdrop-blur-md rounded-xl border-2 border-border shadow-xl flex flex-col overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2 bg-muted/50">
              <GitBranch className="h-5 w-5 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Version History</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {versions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No versions available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`bg-card rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-lg ${
                        highlightedVersion === version.id
                          ? 'border-primary shadow-lg ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {/* Header with version badge and metadata */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            highlightedVersion === version.id
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-muted border-primary/50 text-primary'
                          }`}>
                            {version.label}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {version.label}
                              </span>
                              <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                @{version.label.toLowerCase()}
                              </code>
                            </div>
                            {version.render?.createdAt && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(version.render.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded">
                            Latest
                          </span>
                        )}
                      </div>

                      {/* Render Image */}
                      {version.render?.outputUrl && (
                        <div className="rounded-lg overflow-hidden border border-border mb-3 bg-muted/30">
                          <div className="relative aspect-video w-full">
                            <Image
                              src={version.render.outputUrl}
                              alt={version.label}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        </div>
                      )}

                          {/* Prompt and metadata */}
                          {version.render?.prompt && (
                            <div className="space-y-2">
                              <p className="text-sm text-foreground line-clamp-2 font-medium">
                                {version.render.prompt}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <GitBranch className="h-3 w-3" />
                                  Version {index + 1}
                                </span>
                                {version.render.createdAt && (
                                  <span className="text-muted-foreground/70">
                                    {new Date(version.render.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
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
