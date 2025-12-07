'use client';

import React, { useState } from 'react';
import { RenderChain, Render } from '@/lib/types/render';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  GitBranch, 
  Image as ImageIcon,
  Plus,
  Calendar,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ChainListProps {
  chains: (RenderChain & { renders?: Render[]; renderCount?: number })[];
  projectId: string;
  projectSlug?: string;
  onCreateChain?: () => void;
}

function ChainListComponent({ chains, projectId, projectSlug, onCreateChain }: ChainListProps) {
  if (chains.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Render Chains Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Chains will be created automatically when you generate renders
          </p>
          <Button onClick={onCreateChain}>
            <Plus className="h-4 w-4 mr-2" />
            Create Chain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Render Chains</h2>
        {onCreateChain && (
          <Button onClick={onCreateChain} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Chain
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:gap-4">
        {chains.map((chain) => (
          <Card key={chain.id} className="hover:shadow-lg transition-shadow p-0">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg">{chain.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="w-fit text-xs">
                      <Layers className="h-3 w-3 mr-1" />
                      {chain.renderCount || chain.renders?.length || 0} versions
                    </Badge>
                  </div>
                  {chain.description && (
                    <CardDescription className="text-sm">{chain.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-4 mt-1 sm:mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(chain.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            {chain.renders && chain.renders.length > 0 && (
              <CardContent className="px-3 py-3 sm:px-6 sm:py-6 space-y-0.5 sm:space-y-1">
                <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
                  {chain.renders.map((render) => (
                    <div
                      key={render.id}
                      className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg overflow-hidden border border-border relative"
                    >
                      {render.outputUrl ? (
                        <img
                          src={render.outputUrl}
                          alt={`Version ${render.chainPosition}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-xs px-1 rounded">
                        v{(render.chainPosition || 0) + 1}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons - Moved below images */}
                <div className="grid grid-cols-2 gap-2">
                  <Link href={projectSlug ? `/project/${projectSlug}/chain/${chain.id}` : `/render?chain=${chain.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                      <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Continue
                    </Button>
                  </Link>
                  <Link href={projectSlug ? `/project/${projectSlug}/chain/${chain.id}` : `/dashboard/projects/${projectId}/chain/${chain.id}`}>
                    <Button size="sm" className="w-full text-xs sm:text-sm">
                      View Details
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ChainList = React.memo(ChainListComponent);

