'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimisticRender } from '@/lib/hooks/use-optimistic-generation';

interface OptimisticRenderPreviewProps {
  renders: OptimisticRender[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  isMobile?: boolean;
}

export function OptimisticRenderPreview({ 
  renders, 
  onRemove, 
  onRetry,
  isMobile = false 
}: OptimisticRenderPreviewProps) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  // Simulate progress for generating renders
  useEffect(() => {
    renders.forEach(render => {
      if (render.status === 'generating' && !progress[render.id]) {
        setProgress(prev => ({ ...prev, [render.id]: 0 }));
        
        const interval = setInterval(() => {
          setProgress(prev => {
            const current = prev[render.id] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [render.id]: current + Math.random() * 15 };
          });
        }, 500);

        return () => clearInterval(interval);
      }
    });
  }, [renders]); // Remove progress from dependencies to prevent infinite loop

  if (renders.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "space-y-3",
      isMobile ? "p-2" : "p-4"
    )}>
      <h3 className="text-sm font-medium text-muted-foreground">
        Recent Generations
      </h3>
      
      {renders.map((render) => (
        <Card key={render.id} className="overflow-hidden">
          <CardContent className={cn(
            "p-3",
            render.status === 'generating' && "bg-muted/50"
          )}>
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {render.status === 'generating' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {render.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {render.status === 'failed' && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={render.status === 'completed' ? 'default' : render.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {render.status === 'generating' && 'Generating...'}
                    {render.status === 'completed' && 'Completed'}
                    {render.status === 'failed' && 'Failed'}
                  </Badge>
                  
                  {render.processingTime && (
                    <span className="text-xs text-muted-foreground">
                      {render.processingTime}s
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {render.prompt}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{render.style}</span>
                  <span>•</span>
                  <span>{render.quality}</span>
                  <span>•</span>
                  <span>{render.aspectRatio}</span>
                </div>

                {/* Progress Bar for Generating */}
                {render.status === 'generating' && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className={`bg-blue-500 h-1.5 rounded-full transition-all duration-300 ${
                        progress[render.id] <= 25 ? 'w-1/4' :
                        progress[render.id] <= 50 ? 'w-1/2' :
                        progress[render.id] <= 75 ? 'w-3/4' : 'w-full'
                      }`}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {render.status === 'failed' && render.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-600 dark:text-red-400">
                    {render.error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {render.status === 'completed' && render.imageUrl && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </>
                  )}
                  
                  {render.status === 'failed' && onRetry && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => onRetry(render.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  
                  {onRemove && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => onRemove(render.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
