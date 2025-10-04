'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  progress?: number;
  message?: string;
}

export function GenerationProgress({ 
  isGenerating, 
  progress = 0, 
  message = "Generating your image..." 
}: GenerationProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      setAnimatedProgress(0);
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until actually complete
          return prev + Math.random() * 10;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setAnimatedProgress(progress);
    }
  }, [isGenerating, progress]);

  if (!isGenerating && progress === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-2">
              {message}
            </p>
            
            <Progress 
              value={animatedProgress} 
              className="h-2"
            />
            
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(animatedProgress)}% complete
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
