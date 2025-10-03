'use client';

import { useState } from 'react';
import { EngineSidebar } from './engine-sidebar';
import { ControlBar } from './engines/control-bar';
import { RenderPreview } from './engines/render-preview';

interface EngineLayoutProps {
  children: React.ReactNode;
  engineType: 'exterior' | 'interior' | 'furniture' | 'site-plan';
}

export function EngineLayout({ children, engineType }: EngineLayoutProps) {
  const [renderResult, setRenderResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="relative bg-background w-full h-screen overflow-hidden">
      {/* Slim Sidebar - Fixed position */}
      <EngineSidebar />
      
      {/* Main Content Area - Starts right after collapsed sidebar */}
      <div className="flex ml-16 w-full" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Control Bar - 1/3 width */}
        <ControlBar 
          engineType={engineType} 
          onResult={handleRenderResult}
          onGenerationStart={handleGenerationStart}
        />
        
        {/* Render Preview - 2/3 width */}
        <RenderPreview 
          result={renderResult}
          isGenerating={isGenerating}
          progress={progress}
          engineType={engineType}
        />
      </div>
    </div>
  );
}
