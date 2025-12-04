'use client';

import { useState, useEffect } from 'react';
import { Loader2, FolderOpen, Sparkles } from 'lucide-react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import Image from 'next/image';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';

interface Slide3ChatInterfaceProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
}

export function Slide3ChatInterface({ galleryRenders = [], longestChains = [] }: Slide3ChatInterfaceProps) {
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

  // Get chains with 1-2 renders (short chains) - prefer short chains but fallback to any chains
  const shortChains = longestChains.filter(chain => 
    chain.renders && chain.renders.length >= 1 && chain.renders.length <= 2
  );
  
  // If no short chains, use any chains with renders (up to 6 renders max for demo)
  const chainsToUse = shortChains.length > 0 
    ? shortChains.slice(0, 6)
    : longestChains.filter(chain => chain.renders && chain.renders.length >= 1 && chain.renders.length <= 6).slice(0, 6);
  
  console.log(`📊 Slide3: Filtered to ${chainsToUse.length} chains to use`);

  // Get chains with renders - prefer before/after pairs, but fallback to any completed image render
  const chainsWithRenders = chainsToUse.map(chain => {
    // First try to find a render with both uploaded image and output (before/after)
    let render = chain.renders?.find(r => 
      r.uploadedImageUrl && r.outputUrl && r.status === 'completed' && r.type === 'image'
    );
    
    // If no before/after pair, use any completed image render with output
    if (!render) {
      render = chain.renders?.find(r => 
        r.outputUrl && r.status === 'completed' && r.type === 'image'
      );
    }
    
    return render ? { chain, render } : null;
  }).filter(Boolean) as Array<{ chain: RenderChainWithRenders; render: any }>;

  // Initialize slider positions and loading states
  useEffect(() => {
    const initialPositions: Record<string, number> = {};
    const initialLoading: Record<string, boolean> = {};
    chainsWithRenders.forEach(({ chain }) => {
      initialPositions[chain.id] = 50;
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

  // Auto-animate slider positions for all chains (left to right end to end)
  useEffect(() => {
    const interval = setInterval(() => {
      setSliderPositions((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((chainId) => {
          if (updated[chainId] >= 100) {
            updated[chainId] = 0; // Reset to start (left)
          } else {
            updated[chainId] = (updated[chainId] || 50) + 0.5; // Move right
          }
        });
        return updated;
      });
    }, 50); // Update every 50ms for smooth animation
    return () => clearInterval(interval);
  }, []);

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
      
      <div className="container mx-auto px-8 py-12 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            Multiple Projects & Chains
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage multiple projects and render chains simultaneously
          </p>
        </div>

        {/* Chains Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chainsWithRenders.map(({ chain, render }) => {
              const isLoading = loadingStates[chain.id] ?? true;
              const sliderPosition = sliderPositions[chain.id] ?? 50;
              const hasBeforeAfter = render.uploadedImageUrl && render.outputUrl;

              return (
                <div
                  key={chain.id}
                  className="bg-card rounded-lg border border-border overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Project/Chain Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm truncate">{chain.name || 'Untitled Chain'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {chain.renders?.length || 0} render{chain.renders?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Before/After Slider or Single Image */}
                  <div className="relative w-full slide-3-slider-wrapper" style={{ aspectRatio: '16/9' }}>
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : hasBeforeAfter ? (
                      <>
                        <div className="relative w-full h-full overflow-hidden">
                          <ReactBeforeSliderComponent
                            firstImage={{ imageUrl: render.uploadedImageUrl }}
                            secondImage={{ imageUrl: render.outputUrl }}
                            currentPercentPosition={sliderPosition}
                          />
                          {/* Smaller Labels Over Image - Inverted positions */}
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10">
                            Before
                          </div>
                          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px] font-medium z-10">
                            After
                          </div>
                        </div>
                      </>
                    ) : render.outputUrl ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={render.outputUrl}
                          alt={render.prompt || 'Generated render'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">No image available</p>
                      </div>
                    )}
                  </div>

                  {/* Chain Info Footer */}
                  {render.prompt && (
                    <div className="p-3 bg-muted/50">
                      <p className="text-xs text-muted-foreground line-clamp-2 truncate">
                        {render.prompt}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
