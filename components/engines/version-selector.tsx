'use client';

import { useState } from 'react';
import { Render } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { History, Image as ImageIcon, Check } from 'lucide-react';
import Image from 'next/image';

interface VersionSelectorProps {
  renders: Render[];
  selectedVersionId?: string;
  onSelectVersion: (renderId: string) => void;
  onUseAsReference?: (renderId: string) => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  renders,
  selectedVersionId,
  onSelectVersion,
  onUseAsReference,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const completedRenders = renders.filter(r => r.status === 'completed' && r.outputUrl);
  
  // Debug logging
  console.log('🔍 VersionSelector: Debug info:', {
    totalRenders: renders.length,
    completedRenders: completedRenders.length,
    renders: renders.map(r => ({ id: r.id, status: r.status, hasOutputUrl: !!r.outputUrl }))
  });
  
  if (completedRenders.length === 0) {
    return (
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        No completed renders yet ({renders.length} total renders)
      </div>
    );
  }

  const selectedRender = completedRenders.find(r => r.id === selectedVersionId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">
            {selectedRender ? 'Version Selected' : 'Select Version'}
          </span>
          <span className="sm:hidden">Versions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Previous Renders</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {completedRenders.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No completed renders yet
          </div>
        ) : (
          completedRenders.map((render, index) => (
            <DropdownMenuItem
              key={render.id}
              className="flex items-start gap-3 p-3 cursor-pointer"
              onClick={() => onSelectVersion(render.id)}
            >
              <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                {render.outputUrl ? (
                  <Image
                    src={render.outputUrl}
                    alt={`Version ${completedRenders.length - index}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    Version {completedRenders.length - index}
                  </span>
                  {selectedVersionId === render.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {render.prompt}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {render.settings?.style || 'No style'}
                  </span>
                  {render.chainPosition !== null && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Position {render.chainPosition}
                    </span>
                  )}
                </div>
                
                {onUseAsReference && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseAsReference(render.id);
                      setIsOpen(false);
                    }}
                  >
                    Use as Reference
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

