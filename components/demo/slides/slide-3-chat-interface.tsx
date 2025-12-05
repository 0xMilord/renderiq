'use client';

import { useState, useEffect } from 'react';
import { Loader2, FolderOpen, Sparkles } from 'lucide-react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import Image from 'next/image';
import { useDemoData } from '@/components/demo/demo-data-context';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

interface Slide3ChatInterfaceProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
}

export function Slide3ChatInterface({ galleryRenders = [], longestChains = [] }: Slide3ChatInterfaceProps) {
  const { projects } = useDemoData();
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Debug logging
  useEffect(() => {
    console.log('📊 Slide3: Received chains:', longestChains.length);
    console.log('📊 Slide3: Received gallery renders:', galleryRenders.length);
    longestChains.forEach((chain, idx) => {
      console.log(`  Chain ${idx + 1}: ${chain.name || 'Untitled'} - ${chain.renders?.length || 0} renders`);
      chain.renders?.forEach((render, rIdx) => {
        console.log(`    Render ${rIdx + 1}: status=${render.status}, type=${render.type}, hasOutput=${!!render.outputUrl}, hasUploaded=${!!render.uploadedImageUrl}`);
      });
    });
  }, [longestChains, galleryRenders]);

  // Priority gallery item IDs for Multiple Projects & Chains slide
  // Order matters - chains will appear in this exact order
  const priorityGalleryIds = [
    '64b885e0-b9b7-49ee-9ebb-321fa94ff475',
    '67ca8023-a57d-4e11-aba9-680065dbedfd',
    '5d76d5db-63b9-4cbd-b99b-eec45c048c16',
    '104b24b3-0aed-49bb-9588-7b78fed3a620',
  ];

  // Create a map of gallery items by ID for quick lookup
  const galleryItemsById = new Map(galleryRenders.map(item => [item.id, item]));

  // Find render IDs for priority gallery items in EXACT order
  const priorityRenderIds: string[] = [];
  priorityGalleryIds.forEach(galleryId => {
    const galleryItem = galleryItemsById.get(galleryId);
    if (galleryItem?.renderId) {
      priorityRenderIds.push(galleryItem.renderId);
    }
  });

  // Create a map of chains by their render IDs (for priority ordering)
  const chainsByRenderId = new Map<string, RenderChainWithRenders[]>();
  longestChains.forEach(chain => {
    chain.renders?.forEach(render => {
      if (!chainsByRenderId.has(render.id)) {
        chainsByRenderId.set(render.id, []);
      }
      chainsByRenderId.get(render.id)!.push(chain);
    });
  });

  // Get priority chains in EXACT order based on priority render IDs
  const priorityChainsOrdered: RenderChainWithRenders[] = [];
  const seenChainIds = new Set<string>();
  
  priorityRenderIds.forEach(renderId => {
    const chains = chainsByRenderId.get(renderId) || [];
    chains.forEach(chain => {
      if (!seenChainIds.has(chain.id) && chain.renders && chain.renders.length >= 1 && chain.renders.length <= 6) {
        priorityChainsOrdered.push(chain);
        seenChainIds.add(chain.id);
      }
    });
  });

  // Get rest chains (excluding priority chains)
  const allChains = longestChains.filter(chain => 
    chain.renders && chain.renders.length >= 1 && chain.renders.length <= 6
  );

  const restChains = allChains.filter(chain =>
    !seenChainIds.has(chain.id)
  );

  // Prefer short chains (1-2 renders) within priority and rest
  const priorityShortChains = priorityChainsOrdered.filter(chain => 
    chain.renders && chain.renders.length >= 1 && chain.renders.length <= 2
  );
  const restShortChains = restChains.filter(chain => 
    chain.renders && chain.renders.length >= 1 && chain.renders.length <= 2
  );

  // Combine: priority chains first (in specified order, short preferred), then rest (short preferred)
  const chainsToUse = [
    ...(priorityShortChains.length > 0 ? priorityShortChains : priorityChainsOrdered),
    ...(restShortChains.length > 0 ? restShortChains : restChains)
  ].slice(0, 6); // Limit to 6 chains
  
  console.log(`📊 Slide3: Filtered to ${chainsToUse.length} chains to use (${priorityChainsOrdered.length} priority)`);

  // Get chains with renders - include both images and videos
  // Prefer before/after pairs for images, but also include videos
  const chainsWithRenders = chainsToUse.map(chain => {
    // Get all completed renders (images and videos)
    const completedRenders = chain.renders?.filter(r => 
      r.outputUrl && r.status === 'completed'
    ) || [];
    
    // First try to find an image render with both uploaded image and output (before/after)
    let render = completedRenders.find(r => 
      r.type === 'image' && r.uploadedImageUrl && r.outputUrl
    );
    
    // If no before/after pair, prefer videos, then any image render
    if (!render) {
      render = completedRenders.find(r => r.type === 'video') || 
               completedRenders.find(r => r.type === 'image');
    }
    
    return render ? { chain, render } : null;
  }).filter(Boolean) as Array<{ chain: RenderChainWithRenders; render: any }>;

  // Initialize slider positions and loading states
  useEffect(() => {
    const initialPositions: Record<string, number> = {};
    const initialLoading: Record<string, boolean> = {};
    chainsWithRenders.forEach(({ chain }) => {
      initialPositions[chain.id] = 0; // Start from left (0%)
      initialLoading[chain.id] = true;
    });
    setSliderPositions(initialPositions);
    setLoadingStates(initialLoading);

    // Simulate loading for each chain
    chainsWithRenders.forEach(({ chain }, index) => {
      setTimeout(() => {
        setLoadingStates((prev) => ({ ...prev, [chain.id]: false }));
      }, index * 500); // Stagger loading animations
    });
  }, [chainsWithRenders.length]);

  // Optimized smooth slider animation using requestAnimationFrame
  // Only one pass (0-100%), no looping
  // Animation duration: 8 seconds for smooth transition
  useEffect(() => {
    if (chainsWithRenders.length === 0) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    const animationDuration = 8000; // 8 seconds for one complete pass (0-100%)
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS;
    // Calculate speed: 100% / (duration in seconds * fps)
    // 100% / (8 seconds * 60 fps) = 100 / 480 = 0.208% per frame
    const animationSpeed = 100 / ((animationDuration / 1000) * targetFPS);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      const elapsed = currentTime - startTime;
      
      // Only update if enough time has passed (throttle to ~60fps)
      if (deltaTime >= frameTime) {
        setSliderPositions((prev) => {
          const updated = { ...prev };
          let hasChanges = false;

          chainsWithRenders.forEach(({ chain }) => {
            const currentPos = updated[chain.id] ?? 0;
            if (elapsed >= animationDuration) {
              // Animation complete - stay at 100%
              if (currentPos < 100) {
                updated[chain.id] = 100;
                hasChanges = true;
              }
            } else if (currentPos < 100) {
              // Smoothly move right - only one pass, no reset
              const newPos = Math.min(100, currentPos + animationSpeed);
              updated[chain.id] = newPos;
              hasChanges = true;
            }
          });

          return hasChanges ? updated : prev;
        });

        lastTime = currentTime - (deltaTime % frameTime);
      }

      // Continue animation until complete
      if (elapsed < animationDuration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [chainsWithRenders]);

  if (chainsWithRenders.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Multiple Projects & Chains</h2>
          <p className="text-muted-foreground">No demo data available. Please add renders to the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .slide-3-slider-wrapper .react-before-after-slider-container {
          width: 100% !important;
          height: 100% !important;
        }
        .slide-3-slider-wrapper .react-before-after-slider-container img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}} />
      
      {/* Header - Upper Left */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                Multiple Projects & Chains
              </h2>
            </div>
            <div className="h-6 w-px bg-border"></div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[400px]">
              Manage multiple projects and render chains simultaneously. Compare side by side.
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
      <div className="container mx-auto px-8 py-12 flex-1 flex flex-col min-h-0">

        {/* Chains Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chainsWithRenders.map(({ chain, render }) => {
              const isLoading = loadingStates[chain.id] ?? true;
              const sliderPosition = sliderPositions[chain.id] ?? 0; // Start from left (0%)
              const isVideo = render.type === 'video';
              const hasBeforeAfter = !isVideo && render.uploadedImageUrl && render.outputUrl;

              return (
                <div
                  key={chain.id}
                  className="bg-card rounded-lg border border-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Before/After Slider, Video, or Single Image */}
                  <div className="relative w-full slide-3-slider-wrapper" style={{ aspectRatio: '16/9' }}>
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : isVideo && render.outputUrl ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <video
                          src={render.outputUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : hasBeforeAfter ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <ReactBeforeSliderComponent
                          key={chain.id}
                          firstImage={{ imageUrl: render.uploadedImageUrl }}
                          secondImage={{ imageUrl: render.outputUrl }}
                          currentPercentPosition={Math.max(0, Math.min(100, sliderPosition))}
                        />
                        {/* Smaller Labels Over Image - Inverted positions */}
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10 pointer-events-none">
                          Before
                        </div>
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10 pointer-events-none">
                          After
                        </div>
                      </div>
                    ) : render.outputUrl ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={render.outputUrl}
                          alt={render.prompt || 'Generated render'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">No content available</p>
                      </div>
                    )}
                  </div>

                  {/* Chain Name and Render Prompt */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {chain.name || 'Untitled Chain'}
                    </h3>
                    {render.prompt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {render.prompt}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
