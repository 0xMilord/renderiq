'use client';

import { Render } from '@/lib/types/render';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { deleteRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';

interface RenderChainVizProps {
  renders: Render[];
  selectedRenderId?: string;
  onSelectRender: (renderId: string) => void;
  onVersionSelect?: (render: Render) => void;
  chainId?: string;
  onChainDeleted?: () => void;
  onNewChain?: () => void;
  isMobile?: boolean;
}

export const RenderChainViz: React.FC<RenderChainVizProps> = ({
  renders,
  selectedRenderId,
  onSelectRender,
  onVersionSelect,
  chainId,
  onChainDeleted,
  onNewChain,
  isMobile = false,
}) => {
  console.log('🔗 RenderChainViz: Received renders:', renders);
  console.log('🔗 RenderChainViz: onSelectRender function:', typeof onSelectRender);
  
  // Sort renders by chain position
  const sortedRenders = [...renders]
    .filter(r => r.status === 'completed' && r.outputUrl)
    .sort((a, b) => (a.chainPosition || 0) - (b.chainPosition || 0));
    
  console.log('🔗 RenderChainViz: Sorted renders:', sortedRenders);

  const handleDeleteChain = async () => {
    if (!chainId) return;
    
    if (confirm('Are you sure you want to delete this render chain? This action cannot be undone.')) {
      try {
        const result = await deleteRenderChain(chainId);
        if (result.success) {
          toast.success('Render chain deleted successfully');
          if (onChainDeleted) {
            onChainDeleted();
          }
        } else {
          toast.error(result.error || 'Failed to delete render chain');
        }
      } catch (error) {
        console.error('Error deleting chain:', error);
        toast.error('Failed to delete render chain');
      }
    }
  };

  if (sortedRenders.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-border bg-muted/50 py-4">
      <div className="container px-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Render Chain</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {sortedRenders.length} {sortedRenders.length === 1 ? 'version' : 'versions'}
            </Badge>
            <div className="flex items-center gap-1">
              {onNewChain && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNewChain}
                  className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Chain
                </Button>
              )}
              {chainId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteChain}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <ScrollArea className="w-full">
          <div className="flex items-center gap-3 pb-4">
            {sortedRenders.map((render, index) => (
              <div key={render.id} className="flex items-center gap-3">
                <button
                  onClick={() => {
                    console.log('🔗 RenderChainViz: Render clicked:', render.id);
                    console.log('🔗 RenderChainViz: Calling onSelectRender with:', render.id);
                    onSelectRender(render.id);
                  }}
                  className={cn(
                    'relative flex-shrink-0 rounded-lg overflow-hidden transition-all',
                    'hover:ring-2 hover:ring-primary hover:shadow-lg',
                    'focus:outline-none focus:ring-2 focus:ring-primary',
                    isMobile ? 'w-20 h-16' : 'w-28 h-20',
                    selectedRenderId === render.id && 'ring-2 ring-primary shadow-lg'
                  )}
                >
                  {render.outputUrl ? (
                    <Image
                      src={render.outputUrl}
                      alt={`Version ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                  
                  {/* Position badge */}
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    v{index + 1}
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedRenderId === render.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay with info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-white text-xs truncate">
                        {render.prompt.slice(0, 30)}...
                      </p>
                    </div>
                  </div>
                </button>
                
                {/* Arrow between renders */}
                {index < sortedRenders.length - 1 && (
                  <ArrowRight className="flex-shrink-0 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

