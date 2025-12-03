'use client';

import { useState, useEffect } from 'react';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { Loader2, MessageSquare, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

interface Slide3ChatInterfaceProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
}

export function Slide3ChatInterface({ galleryRenders = [], longestChains = [] }: Slide3ChatInterfaceProps) {
  const [showTooltips, setShowTooltips] = useState(true);
  const [tooltipIndex, setTooltipIndex] = useState(0);
  
  // Find the longest chain from gallery renders or longestChains
  let demoChain: RenderChainWithRenders | null = null;
  let demoRender: GalleryItemWithDetails | undefined;
  
  if (longestChains.length > 0) {
    // Use the longest chain (first one has most renders)
    demoChain = longestChains[0];
    demoRender = galleryRenders.find(r => r.render.chainId === demoChain?.id);
  } else {
    // Fallback to finding chain from gallery renders
    demoRender = galleryRenders.find(r => r.render.projectId && r.render.chainId);
  }
  
  const projectId = demoChain?.projectId || demoRender?.render.projectId || '';
  const chainId = demoChain?.id || demoRender?.render.chainId || '';
  
  // Fetch chain data if we have a chainId
  const { chain, loading } = useRenderChain(chainId || null);
  const finalChain = chain || demoChain;

  // Cycle through tooltips
  useEffect(() => {
    if (!showTooltips) return;
    
    const tooltips = [
      { id: 'input', label: 'User Input', desc: 'Type your prompt here to generate renders' },
      { id: 'chat', label: 'Chat History', desc: 'View your conversation and render history' },
      { id: 'render', label: 'Rendered Output', desc: 'See your photorealistic renders appear here' },
      { id: 'settings', label: 'Settings', desc: 'Adjust quality, style, and other options' },
    ];
    
    const interval = setInterval(() => {
      setTooltipIndex((prev) => (prev + 1) % tooltips.length);
    }, 5000); // Change tooltip every 5 seconds
    
    return () => clearInterval(interval);
  }, [showTooltips]);

  // Hide tooltips after 20 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltips(false);
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  // If no demo data available, show a message
  if (!demoRender && !demoChain) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Unified Chat Interface</h2>
          <p className="text-muted-foreground">No demo data available. Please add renders to the gallery.</p>
        </div>
      </div>
    );
  }

  if (loading && !demoChain) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-foreground">Loading chat interface...</p>
        </div>
      </div>
    );
  }

  const tooltips = [
    { id: 'input', label: 'User Input', desc: 'Type your prompt here to generate renders', position: 'bottom' },
    { id: 'chat', label: 'Chat History', desc: 'View your conversation and render history', position: 'right' },
    { id: 'render', label: 'Rendered Output', desc: 'See your photorealistic renders appear here', position: 'left' },
    { id: 'settings', label: 'Settings', desc: 'Adjust quality, style, and other options', position: 'top' },
  ];

  const currentTooltip = tooltips[tooltipIndex];

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Override UnifiedChatInterface height for full screen demo */
        .demo-chat-fullscreen > div {
          height: 100vh !important;
        }
        .demo-chat-fullscreen > div > div {
          height: 100vh !important;
        }
        /* Hide back button and mobile header in demo */
        .demo-chat-fullscreen .lg\\:hidden.border-b {
          display: none !important;
        }
      `}} />
      
      {/* Tooltip Overlay */}
      {showTooltips && (
        <TooltipProvider>
          <div className="absolute inset-0 z-50 pointer-events-none">
            {tooltips.map((tooltip, index) => (
              <Tooltip key={tooltip.id} open={index === tooltipIndex}>
                <TooltipTrigger asChild>
                  <div 
                    className={`absolute ${
                      tooltip.id === 'input' ? 'bottom-20 left-1/2 -translate-x-1/2' :
                      tooltip.id === 'chat' ? 'left-4 top-1/2 -translate-y-1/2' :
                      tooltip.id === 'render' ? 'right-4 top-1/2 -translate-y-1/2' :
                      'top-4 left-1/2 -translate-x-1/2'
                    } w-64 h-16 pointer-events-auto`}
                  />
                </TooltipTrigger>
                <TooltipContent 
                  side={tooltip.position as any}
                  className="bg-primary text-primary-foreground p-4 text-lg max-w-xs border-2 border-primary/50 shadow-2xl z-50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {tooltip.id === 'input' && <MessageSquare className="h-6 w-6" />}
                    {tooltip.id === 'chat' && <MessageSquare className="h-6 w-6" />}
                    {tooltip.id === 'render' && <ImageIcon className="h-6 w-6" />}
                    {tooltip.id === 'settings' && <Zap className="h-6 w-6" />}
                    <h3 className="font-bold text-lg">{tooltip.label}</h3>
                  </div>
                  <p className="text-sm opacity-90">{tooltip.desc}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* Demo Flow Indicator */}
      {showTooltips && finalChain && finalChain.renders && finalChain.renders.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-primary shadow-lg">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Demo: {finalChain.renders.length} renders in conversation
              </p>
              <p className="text-xs text-muted-foreground">
                Showing real user workflow with {finalChain.renders.length} iterations
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full relative z-10 demo-chat-fullscreen">
        <UnifiedChatInterface
          projectId={projectId}
          chainId={chainId}
          chain={finalChain || undefined}
          projectName={demoRender?.user.name || "Demo Project"}
          chainName={finalChain?.name || "Demo Chain"}
          onBackToProjects={() => {}}
        />
      </div>
    </div>
  );
}
