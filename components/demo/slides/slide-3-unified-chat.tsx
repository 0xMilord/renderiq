'use client';

import { useState, useEffect, useRef } from 'react';
import { useDemoData } from '@/components/demo/demo-data-context';
import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { Sparkles } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
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

  // Get top 5 images by likes (already sorted by popularity from demo page)
  const top5Images = galleryRenders
    .filter(r => 
      r.render?.status === 'completed' && 
      r.render?.outputUrl && 
      r.render?.type === 'image'
    )
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
  const demoChainWithTop5: RenderChainWithRenders | undefined = demoChain ? {
    ...demoChain,
    renders: top5Images
      .map(img => {
        // Find the render in the chain or create a mock render
        const chainRender = demoChain.renders?.find(r => r.id === img.renderId);
        if (chainRender) return chainRender;
        // If not found, create a mock render from the gallery item
        return {
          id: img.renderId,
          projectId: img.render.projectId || '',
          chainId: demoChain.id,
          chainPosition: top5Images.indexOf(img),
          prompt: img.render.prompt || '',
          type: 'image' as const,
          status: 'completed' as const,
          outputUrl: img.render.outputUrl || '',
          uploadedImageUrl: img.render.uploadedImageUrl || undefined,
          createdAt: img.render.createdAt || new Date(),
          updatedAt: img.render.updatedAt || new Date(),
        } as Render;
      })
      .filter(Boolean) as Render[],
  } : undefined;

  // Autopilot: Cycle through top 5 images
  useEffect(() => {
    if (top5Images.length === 0 || !demoChainWithTop5) return;

    // Reset state
    setCurrentImageIndex(0);
    setIsShowingThinking(false);
    setHasShownImage(false);

    // Start autopilot cycle
    const cycleImages = () => {
      // For each image: show thinking, then show image after 2 seconds
      let imageIdx = 0;
      
      const showNextImage = () => {
        if (imageIdx >= top5Images.length) {
          // Restart cycle
          imageIdx = 0;
        }
        
        setCurrentImageIndex(imageIdx);
        setIsShowingThinking(true);
        setHasShownImage(false);

        // After 2 seconds, show the image
        autopilotRef.current = setTimeout(() => {
          setIsShowingThinking(false);
          setHasShownImage(true);
          
          // After showing image, move to next after a delay
          autopilotRef.current = setTimeout(() => {
            imageIdx++;
            if (imageIdx < top5Images.length) {
              showNextImage();
            } else {
              // Restart cycle
              imageIdx = 0;
              setTimeout(showNextImage, 1000);
            }
          }, 3000); // Show image for 3 seconds
        }, 2000); // Show thinking for 2 seconds
      };

      showNextImage();
    };

    cycleImages();

    return () => {
      if (autopilotRef.current) {
        clearTimeout(autopilotRef.current);
      }
    };
  }, [top5Images.length, demoChainWithTop5?.id]);

  // Create a filtered chain that only shows renders up to current index
  const filteredChain: RenderChainWithRenders | undefined = demoChainWithTop5 ? {
    ...demoChainWithTop5,
    renders: demoChainWithTop5.renders
      .slice(0, currentImageIndex + (hasShownImage ? 1 : 0))
      .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0)),
  } : undefined;

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
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Header - Upper Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Unified Chat Interface
          </h2>
        </div>
        <div className="h-6 w-px bg-border"></div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-[250px]">
          Chat naturally with AI to generate renders. See your conversation and results in real-time.
        </p>
      </div>

      {/* Actual Unified Chat Interface - Full Width */}
      <div className="w-full h-full pt-20">
        {filteredChain && (
          <UnifiedChatInterface
            projectId={demoProjectId}
            chainId={filteredChain.id}
            chain={filteredChain}
            projectName={demoProject?.name || 'Demo Project'}
            chainName={filteredChain.name || 'Demo Chain'}
            onBackToProjects={() => {}}
          />
        )}
      </div>
    </div>
  );
}
