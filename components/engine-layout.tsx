'use client';

import { useState, useEffect } from 'react';
import { EngineSidebar } from './engine-sidebar';
import { ControlBar } from './engines/control-bar';
import { RenderPreview } from './engines/render-preview';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRenders } from '@/lib/hooks/use-renders';

interface EngineLayoutProps {
  children: React.ReactNode;
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
  chainId?: string;
}

export function EngineLayout({ children, engineType, chainId }: EngineLayoutProps) {
  const [renderResult, setRenderResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Fetch renders for the selected project
  const { renders } = useRenders(selectedProjectId);

  const handleRenderResult = (result: unknown) => {
    console.log('🎉 EngineLayout: Render result received:', result);
    console.log('🎉 EngineLayout: Result type:', typeof result);
    console.log('🎉 EngineLayout: Result has imageUrl:', !!(result as any)?.imageUrl);
    console.log('🎉 EngineLayout: Result imageUrl value:', (result as any)?.imageUrl);
    setRenderResult(result);
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
    setSelectedProjectId(projectId);
    setSelectedRenderId(null);
    setRenderResult(null);
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

  // Handle swipe gestures for mobile drawer
  useEffect(() => {
    if (!isMobile) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      // Prevent default scrolling when swiping up/down
      if (Math.abs(deltaY) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      
      const deltaY = currentY - startY;
      const threshold = 50;
      
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          // Swipe down - close drawer
          setIsDrawerOpen(false);
        } else {
          // Swipe up - open drawer
          setIsDrawerOpen(true);
        }
      }
    };

    const handleCloseDrawer = () => {
      setIsDrawerOpen(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('closeMobileDrawer', handleCloseDrawer);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('closeMobileDrawer', handleCloseDrawer);
    };
  }, [isMobile]);

  return (
    <div className="relative bg-background w-full h-screen overflow-hidden">
      {/* Slim Sidebar - Fixed position */}
      <EngineSidebar />
      
      {/* Main Content Area - Starts right after collapsed sidebar */}
      <div className="flex ml-0 lg:ml-16 flex-col lg:flex-row h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-4rem)]">
        {/* Control Bar - Desktop: 1/3 width, Mobile: Swipeable drawer */}
        {isMobile ? (
          <>
            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsDrawerOpen(false)}
              />
            )}
            
            {/* Mobile Drawer Handle - Always visible 10% above bottom nav */}
            <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden">
              {/* Drawer Handle - Always visible */}
              <div 
                className="bg-background border-t border-border rounded-t-lg cursor-pointer shadow-lg h-12"
                onClick={() => setIsDrawerOpen(true)}
              >
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-12 h-1 bg-muted-foreground rounded-full" />
                    <span className="text-xs text-muted-foreground">Swipe up for controls</span>
                  </div>
                </div>
              </div>
              
              {/* Full Drawer Content - Only visible when open */}
              {isDrawerOpen && (
                <div className="bg-background border-t border-border max-h-[calc(80vh-4rem)] overflow-hidden">
                  <div className="h-[calc(80vh-7rem)] overflow-y-auto">
                    <ControlBar 
                      engineType={engineType} 
                      onResult={handleRenderResult}
                      onGenerationStart={handleGenerationStart}
                      onProjectChange={handleProjectChange}
                      isMobile={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <ControlBar 
            engineType={engineType} 
            onResult={handleRenderResult}
            onGenerationStart={handleGenerationStart}
            onProjectChange={handleProjectChange}
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
        />
      </div>
    </div>
  );
}
