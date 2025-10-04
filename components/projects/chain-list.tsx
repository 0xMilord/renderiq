'use client';

import { useState } from 'react';
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
  onCreateChain?: () => void;
}

export function ChainList({ chains, projectId, onCreateChain }: ChainListProps) {
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

      <div className="grid gap-4">
        {chains.map((chain) => (
          <Card key={chain.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{chain.name}</CardTitle>
                    <Badge variant="secondary">
                      <Layers className="h-3 w-3 mr-1" />
                      {chain.renderCount || chain.renders?.length || 0} versions
                    </Badge>
                  </div>
                  {chain.description && (
                    <CardDescription>{chain.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(chain.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/engine/exterior-ai/${chain.id}`}>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Continue
                    </Button>
                  </Link>
                  <Link href={`/dashboard/projects/${projectId}/chain/${chain.id}`}>
                    <Button size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            {chain.renders && chain.renders.length > 0 && (
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {chain.renders.slice(0, 5).map((render) => (
                    <div
                      key={render.id}
                      className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-border relative"
                    >
                      {render.outputUrl ? (
                        <img
                          src={render.outputUrl}
                          alt={`Version ${render.chainPosition}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                        v{(render.chainPosition || 0) + 1}
                      </div>
                    </div>
                  ))}
                  {chain.renders.length > 5 && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                      +{chain.renders.length - 5} more
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

