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
    setRenderResult(result);
    setIsGenerating(false);
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
    setProgress(0);
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 1000);
  };

  return (
    <div className="relative bg-gray-50 w-full h-screen overflow-hidden">
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
