'use client';

import { useState, useEffect } from 'react';
import { EngineSidebar } from './engine-sidebar';
import { ControlBar } from './engines/control-bar';
import { RenderPreview } from './engines/render-preview';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRenders } from '@/lib/hooks/use-renders';
import { AutoFillData } from './engines/control-bar';
import { Render } from '@/lib/db/schema';
import { MobileDrawer } from './ui/mobile-drawer';

interface EngineLayoutProps {
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  chainId?: string;
}

interface RenderResult {
  imageUrl: string;
  type?: 'video' | 'image';
  thumbnail?: string;
  style?: string;
  quality?: string;
  aspectRatio?: string;
  processingTime?: number;
}

export function EngineLayout({ engineType, chainId }: EngineLayoutProps) {
  console.log('🏗️ EngineLayout initialized with chainId:', chainId);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  
  // Debug renderResult changes
  useEffect(() => {
    console.log('🖼️ EngineLayout: renderResult changed:', renderResult);
    if (renderResult) {
      console.log('🖼️ EngineLayout: renderResult has imageUrl:', !!renderResult.imageUrl);
      console.log('🖼️ EngineLayout: renderResult imageUrl value:', renderResult.imageUrl);
    }
  }, [renderResult]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null);
  const [iterateImageUrl, setIterateImageUrl] = useState<string | null>(null);
  const [autoFillTrigger, setAutoFillTrigger] = useState<AutoFillData | null>(null);
  const isMobile = useIsMobile();
  
  // Fetch renders for the selected project
  const { renders } = useRenders(selectedProjectId);

  const handleRenderResult = (result: unknown) => {
    console.log('🎉 EngineLayout: Render result received:', result);
    console.log('🎉 EngineLayout: Result type:', typeof result);
    const typedResult = result as RenderResult | null;
    console.log('🎉 EngineLayout: Result has imageUrl:', !!typedResult?.imageUrl);
    console.log('🎉 EngineLayout: Result imageUrl value:', typedResult?.imageUrl);
    setRenderResult(typedResult);
    setProgress(100); // Complete the progress
    setIsGenerating(false);
    console.log('✅ EngineLayout: State updated - isGenerating: false, progress: 100%, result set');
  };
  
  const handleSelectRender = (renderId: string) => {
    console.log('🎯 EngineLayout: Render selected:', renderId);
    setSelectedRenderId(renderId);
    
    // Find the selected render and set it as the result
    const selectedRender = renders.find(r => r.id === renderId);
    if (selectedRender && selectedRender.outputUrl) {
      setRenderResult({
        imageUrl: selectedRender.outputUrl,
        type: selectedRender.type,
        style: selectedRender.settings?.style,
        quality: selectedRender.settings?.quality,
        aspectRatio: selectedRender.settings?.aspectRatio,
        processingTime: selectedRender.processingTime,
      });
    }
  };
  
  const handleProjectChange = (projectId: string) => {
    console.log('📁 EngineLayout: Project changed:', projectId);
    console.log('📁 EngineLayout: Current renderResult before project change:', renderResult);
    setSelectedProjectId(projectId);
    setSelectedRenderId(null);
    
    // Don't reset renderResult if it was just set by version selection
    // Only reset if it's a genuine project change (not from version selection)
    if (!renderResult || !renderResult.imageUrl) {
      setRenderResult(null);
      console.log('📁 EngineLayout: Reset renderResult to null');
    } else {
      console.log('📁 EngineLayout: Keeping existing renderResult during project change');
    }
  };

  const handleIterate = (imageUrl: string) => {
    console.log('🔄 EngineLayout: Iterate requested with image:', imageUrl);
    setIterateImageUrl(imageUrl);
    
    // Create a mock render object for auto-fill
    const mockRender: Render = {
      id: 'iterate-' + Date.now(),
      projectId: selectedProjectId || '',
      userId: '', // Will be filled by the backend
      type: 'image',
      prompt: '', // Will be filled from current form state
      settings: {
        style: 'realistic',
        quality: 'standard',
        aspectRatio: '16:9'
      },
      outputUrl: imageUrl,
      outputKey: '',
      status: 'completed',
      errorMessage: null,
      processingTime: null,
      creditsCost: 1,
      priority: 0,
      queuePosition: null,
      estimatedCompletionAt: null,
      startedAt: null,
      completedAt: new Date(),
      chainId: chainId || null,
      chainPosition: null,
      parentRenderId: null,
      referenceRenderId: null,
      contextData: null,
      thumbnailUrl: imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Trigger version selection to auto-fill the form
    handleVersionSelect(mockRender);
  };

  const handleVersionSelect = (render: Render) => {
    console.log('📋 EngineLayout: Version selected for auto-fill and main display:', render);
    console.log('📋 EngineLayout: Render settings:', render.settings);
    console.log('📋 EngineLayout: Current renderResult before update:', renderResult);
    console.log('📋 EngineLayout: Render outputUrl:', render.outputUrl);
    
    // Update the main render area with the selected version
    if (render.outputUrl) {
      const newRenderResult = {
        imageUrl: render.outputUrl,
        type: render.type || 'image',
        style: render.settings?.style,
        quality: render.settings?.quality,
        aspectRatio: render.settings?.aspectRatio,
        processingTime: render.processingTime,
      };
      console.log('🖼️ EngineLayout: Setting new render result:', newRenderResult);
      setRenderResult(newRenderResult);
      console.log('✅ EngineLayout: Main render area updated with version image');
    } else {
      console.log('⚠️ EngineLayout: No outputUrl found for selected render');
    }
    
    const settings = render.settings as Record<string, string | number> | null;
    
    const autoFillData: AutoFillData = {
      prompt: render.prompt || '',
      style: (settings?.style as string) || 'realistic',
      quality: (settings?.quality as string) || 'standard',
      aspectRatio: (settings?.aspectRatio as string) || '16:9',
      renderMode: settings?.renderMode as string | undefined,
      negativePrompt: settings?.negativePrompt as string | undefined,
      imageType: settings?.imageType as string | undefined,
      imageUrl: render.outputUrl || undefined,
    };
    
    console.log('📋 EngineLayout: Created auto-fill data:', autoFillData);
    setAutoFillTrigger(autoFillData);
    console.log('✅ EngineLayout: Auto-fill triggered with data:', autoFillData);
  };

  const handleGenerationStart = () => {
    console.log('🚀 EngineLayout: Generation started');
    setIsGenerating(true);
    setProgress(0);
    setRenderResult(null); // Clear previous result
    console.log('📊 EngineLayout: Starting progress simulation');
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          console.log('⏸️ EngineLayout: Progress simulation paused at 95%');
          clearInterval(interval);
          return 95; // Cap at 95%
        }
        const increment = Math.random() * 5; // Smaller increments
        const newProgress = Math.min(prev + increment, 95); // Cap at 95%
        console.log(`📈 EngineLayout: Progress update: ${newProgress.toFixed(1)}%`);
        return newProgress;
      });
    }, 1000);
  };

  // Handle drawer close from outside components
  useEffect(() => {
    const handleCloseDrawer = () => {
      setIsDrawerOpen(false);
    };

    window.addEventListener('closeMobileDrawer', handleCloseDrawer);
    return () => {
      window.removeEventListener('closeMobileDrawer', handleCloseDrawer);
    };
  }, []);

  return (
    <div className="relative bg-background w-full h-screen overflow-hidden">
      {/* Slim Sidebar - Fixed position */}
      <EngineSidebar />
      
      {/* Main Content Area - Starts right after collapsed sidebar */}
      <div className="flex ml-0 lg:ml-16 flex-col lg:flex-row h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-4rem)]">
        {/* Control Bar - Desktop: 1/3 width, Mobile: Framer Motion drawer */}
        {isMobile ? (
          <>
            {/* Mobile Drawer Handle - Always visible */}
            <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden">
              <div 
                className="bg-background border-t border-border rounded-t-lg cursor-pointer shadow-lg h-12 flex items-center justify-center"
                onClick={() => setIsDrawerOpen(true)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-12 h-1 bg-muted-foreground rounded-full" />
                  <span className="text-xs text-muted-foreground">Swipe up for controls</span>
                </div>
              </div>
            </div>
            
            {/* Framer Motion Mobile Drawer */}
            <MobileDrawer 
              isOpen={isDrawerOpen} 
              onClose={() => setIsDrawerOpen(false)}
            >
              <ControlBar 
                engineType={engineType}
                chainId={chainId}
                iterateImageUrl={iterateImageUrl}
                autoFillTrigger={autoFillTrigger}
                onResult={handleRenderResult}
                onGenerationStart={handleGenerationStart}
                onProjectChange={handleProjectChange}
                onVersionSelect={handleVersionSelect}
                isMobile={true}
              />
            </MobileDrawer>
          </>
        ) : (
          <ControlBar 
            engineType={engineType}
            chainId={chainId}
            iterateImageUrl={iterateImageUrl}
            autoFillTrigger={autoFillTrigger}
            onResult={handleRenderResult}
            onGenerationStart={handleGenerationStart}
            onProjectChange={handleProjectChange}
            onVersionSelect={handleVersionSelect}
            isMobile={false}
          />
        )}
        
        {/* Render Preview - 2/3 width on desktop, full width on mobile */}
        <RenderPreview 
          result={renderResult}
          isGenerating={isGenerating}
          progress={progress}
          engineType={engineType}
          isMobile={isMobile}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          chainRenders={renders}
          selectedRenderId={selectedRenderId || undefined}
          onSelectRender={handleSelectRender}
          onIterate={handleIterate}
          onVersionSelect={handleVersionSelect}
        />
      </div>
    </div>
  );
}
