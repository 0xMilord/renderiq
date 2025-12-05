'use client';

import { useState, useEffect, useRef } from 'react';
import { useDemoData } from '@/components/demo/demo-data-context';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { Sparkles } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});
import type { Render } from '@/lib/types/render';

interface Slide3UnifiedChatProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
}

export function Slide3UnifiedChat({ galleryRenders = [], longestChains = [] }: Slide3UnifiedChatProps) {
  const { projects, chains } = useDemoData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isShowingThinking, setIsShowingThinking] = useState(false);
  const [hasShownImage, setHasShownImage] = useState(false);
  const autopilotRef = useRef<NodeJS.Timeout | null>(null);

  // Simple: Filter for completed images, sort by likes (descending), take top 5
  const top5Images = galleryRenders
    .filter(r => 
      r.render?.status === 'completed' && 
      r.render?.outputUrl && 
      r.render?.type === 'image'
    )
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 5);

  // Find the project and chain for the first image
  const firstImage = top5Images[0];
  const demoProjectId = firstImage?.render?.projectId;
  const demoProject = demoProjectId ? projects[demoProjectId] : null;
  
  // Find a chain that contains these renders, or use the first available chain
  const demoChain = longestChains.find(chain => 
    chain.projectId === demoProjectId && 
    chain.renders && 
    chain.renders.some(r => top5Images.some(img => img.renderId === r.id))
  ) || longestChains.find(chain => chain.projectId === demoProjectId) || longestChains[0];

  // Build a chain with only the top 5 images for demo
  // Ensure each render has the correct uploadedImageUrl from the gallery item
  // Set all chainPositions to 0 to prevent before/after sliders in demo
  const demoChainWithTop5: RenderChainWithRenders | undefined = demoChain ? {
    ...demoChain,
    renders: top5Images
      .map((img, index) => {
        // Always prioritize gallery item data over chain render data
        // Find the render in the chain or create a mock render
        const chainRender = demoChain.renders?.find(r => r.id === img.renderId);
        
        // Ensure we have outputUrl from gallery item
        const outputUrl = img.render?.outputUrl || chainRender?.outputUrl || '';
        const uploadedImageUrl = img.render?.uploadedImageUrl || chainRender?.uploadedImageUrl || undefined;
        
        if (!outputUrl) {
          // Skip renders without outputUrl
          return null;
        }
        
        if (chainRender) {
          // Always use the uploadedImageUrl and outputUrl from the gallery item to ensure sync
          return {
            ...chainRender,
            chainPosition: index, // Use index for proper ordering
            uploadedImageUrl: uploadedImageUrl,
            outputUrl: outputUrl, // Always use gallery item's outputUrl
            prompt: img.render?.prompt || chainRender.prompt || '',
            status: 'completed' as const, // Ensure status is completed
            type: (img.render?.type || chainRender.type || 'image') as 'image' | 'video',
          };
        }
        // If not found, create a mock render from the gallery item
        return {
          id: img.renderId,
          projectId: img.render?.projectId || '',
          chainId: demoChain.id,
          chainPosition: index, // Use index for proper ordering
          prompt: img.render?.prompt || '',
          type: (img.render?.type || 'image') as 'image' | 'video',
          status: 'completed' as const,
          outputUrl: outputUrl, // Always use gallery item's outputUrl
          uploadedImageUrl: uploadedImageUrl,
          createdAt: img.render?.createdAt || new Date(),
          updatedAt: img.render?.updatedAt || new Date(),
          settings: img.render?.settings || chainRender?.settings || {},
        } as Render;
      })
      .filter((r): r is Render => r !== null && !!r && !!r.outputUrl) // Only include renders with outputUrl
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0)), // Sort by chainPosition
  } : undefined;

  // Autopilot: Cycle through top 5 images sequentially
  // Slide duration: 30 seconds, so 12 seconds per image (60s / 5 = 12s) - slowed down 50%
  // Sequence: User message (0s) -> Bot thinking (2s) -> Image render (6s) -> Next (12s) = 12s per image
  useEffect(() => {
    if (top5Images.length === 0 || !demoChainWithTop5) return;

    // Clear any existing timeouts
    const allTimeouts: NodeJS.Timeout[] = [];

    // Reset state
    setCurrentImageIndex(0);
    setIsShowingThinking(false);
    setHasShownImage(false);

    let imageIdx = 0;

    const processNextImage = () => {
      if (imageIdx >= top5Images.length) {
        // All images processed, restart from beginning
        imageIdx = 0;
        setCurrentImageIndex(0);
        setIsShowingThinking(false);
        setHasShownImage(false);
        // Restart after a brief pause
        const restartTimeout = setTimeout(() => {
          processNextImage();
        }, 2000);
        allTimeouts.push(restartTimeout);
        return;
      }

      // Step 1: Show user message with attached image (if available)
      // This happens immediately when we set the index
      setCurrentImageIndex(imageIdx);
      setIsShowingThinking(false);
      setHasShownImage(false);

      // Step 2: After 2 seconds (slowed down 50%), show bot thinking state
      const thinkingTimeout = setTimeout(() => {
        setIsShowingThinking(true);
        setHasShownImage(false);
      }, 2000);
      allTimeouts.push(thinkingTimeout);

      // Step 3: After 6 seconds total (2s user message + 4s thinking), show the rendered image
      const showImageTimeout = setTimeout(() => {
        setIsShowingThinking(false);
        setHasShownImage(true);
      }, 6000);
      allTimeouts.push(showImageTimeout);

      // Step 4: After 12 seconds total (slowed down 50%), move to next image
      const nextImageTimeout = setTimeout(() => {
        imageIdx++;
        processNextImage();
      }, 12000);
      allTimeouts.push(nextImageTimeout);
    };

    // Start the sequence
    processNextImage();

    return () => {
      allTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [top5Images.length, demoChainWithTop5?.id]);

  // Create a filtered chain that only shows renders up to current index
  // Show renders progressively: user message (with uploaded image) -> thinking -> rendered image
  const filteredChain: RenderChainWithRenders | undefined = demoChainWithTop5 ? {
    ...demoChainWithTop5,
    renders: demoChainWithTop5.renders
      .map((render, originalIdx) => {
        // Only include renders up to and including current index
        if (originalIdx > currentImageIndex) {
          return null; // Exclude future renders
        }
        
        // Get the corresponding gallery image for this render
        const galleryImage = top5Images[originalIdx];
        const outputUrl = render.outputUrl || galleryImage?.render?.outputUrl || '';
        const uploadedImageUrl = render.uploadedImageUrl || galleryImage?.render?.uploadedImageUrl;
        
        // For the current render, control its status based on state
        if (originalIdx === currentImageIndex) {
          if (hasShownImage) {
            // Image has been rendered - show completed render with outputUrl
            return { 
              ...render, 
              status: 'completed' as const,
              outputUrl: outputUrl,
              uploadedImageUrl: uploadedImageUrl,
            };
          } else if (isShowingThinking) {
            // Bot is thinking - show render but it will appear as processing
            return { 
              ...render, 
              status: 'processing' as const,
              outputUrl: outputUrl, // Keep outputUrl even when processing so it can appear
              uploadedImageUrl: uploadedImageUrl,
            };
          } else {
            // User message phase - show render with uploaded image
            return { 
              ...render, 
              status: 'processing' as const,
              outputUrl: outputUrl, // Keep outputUrl for consistency
              uploadedImageUrl: uploadedImageUrl,
            };
          }
        }
        // Previous renders are always completed - ensure they have outputUrl
        return { 
          ...render, 
          status: 'completed' as const,
          outputUrl: outputUrl,
          uploadedImageUrl: uploadedImageUrl,
        };
      })
      .filter((render): render is Render => render !== null && !!render.outputUrl) // Only include renders with outputUrl
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0)),
  } : undefined;

  // Get the current render being processed
  const currentRender = top5Images[currentImageIndex];

  if (!demoProjectId || !demoChainWithTop5 || top5Images.length === 0) {
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Override UnifiedChatInterface height in demo to use container height */
        /* Target the root UnifiedChatInterface div which has h-[calc(100vh-2.75rem)] */
        .demo-unified-chat-container > div {
          height: 100% !important;
          max-height: 100% !important;
        }
        .demo-unified-chat-container > div > div {
          height: 100% !important;
          max-height: 100% !important;
        }
        /* Override any calc-based height within the demo container */
        .demo-unified-chat-container * {
          max-height: none !important;
        }
        .demo-unified-chat-container > div[style*="height"] {
          height: 100% !important;
        }
        /* Hide before/after compare sliders in demo */
        .demo-unified-chat-container .react-before-after-slider-container,
        .demo-unified-chat-container [class*="react-before-after"],
        .demo-unified-chat-container [class*="before-after"] {
          display: none !important;
        }
        /* Hide the container div that wraps the slider */
        .demo-unified-chat-container > div > div > div > div > div > div > div:has([class*="react-before-after"]) {
          display: none !important;
        }
      `}} />
      <div className="relative w-full h-full flex flex-col bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
        {/* Header - Upper Left */}
        <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  Unified Chat Interface
                </h2>
              </div>
              <div className="h-6 w-px bg-border"></div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
                Chat naturally with AI to generate renders. See your conversation and results in real-time.
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

        {/* Actual Unified Chat Interface - Full Width */}
        <div className="flex-1 w-full min-h-0 overflow-hidden demo-unified-chat-container">
          {filteredChain && filteredChain.renders && filteredChain.renders.length > 0 && filteredChain.renders.every(r => r.outputUrl) && (() => {
            // Get the latest completed render ID for the key to force updates
            const completedRenders = filteredChain.renders.filter(r => r.status === 'completed');
            const latestRenderId = completedRenders.length > 0 
              ? completedRenders.sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0]?.id 
              : 'none';
            
            return (
              <UnifiedChatInterface
                key={`demo-chat-${demoProjectId}-${filteredChain.id}-${currentImageIndex}-${latestRenderId}`}
                projectId={demoProjectId}
                chainId={filteredChain.id}
                chain={filteredChain}
                projectName={demoProject?.name || 'Demo Project'}
                chainName={filteredChain.name || 'Demo Chain'}
                onBackToProjects={() => {}}
              />
            );
          })()}
        </div>
      </div>
    </>
  );
}
