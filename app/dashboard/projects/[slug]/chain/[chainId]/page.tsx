'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  GitBranch, 
  Image as ImageIcon,
  Loader2,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { RenderChainViz } from '@/components/engines/render-chain-viz';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { formatDistanceToNow } from 'date-fns';

export default function ChainDetailPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ slug: string; chainId: string }> 
}) {
  const router = useRouter();
  const [params, setParams] = useState<{ slug: string; chainId: string } | null>(null);
  
  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  const slug = params?.slug || '';
  const chainId = params?.chainId || '';

  const { chain, renders, loading, error } = useRenderChain(chainId);
  const [selectedRenderId, setSelectedRenderId] = useState<string>();

  // Memoize selected render lookup to avoid recalculating on every render
  const selectedRender = useMemo(() => {
    return selectedRenderId ? renders.find(r => r.id === selectedRenderId) : undefined;
  }, [renders, selectedRenderId]);

  // Memoize setSelectedRenderId handler
  const handleSelectRender = useCallback((renderId: string) => {
    setSelectedRenderId(renderId);
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading chain...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chain) {
    return (
      <div className="h-full w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center py-8 sm:py-12">
            <div className="text-destructive mb-4 text-sm sm:text-base">Chain not found</div>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{error || 'The chain you are looking for does not exist.'}</p>
            <Button asChild size="sm" className="text-sm">
              <Link href={`/dashboard/projects/${slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                Back to Project
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <Button variant="ghost" size="sm" asChild className="self-start shrink-0">
              <Link href={`/dashboard/projects/${slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                <span className="text-sm">Back</span>
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">{chain.name}</h1>
                <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
                  {renders.length} version{renders.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              {chain.description && (
                <p className="text-sm sm:text-base text-muted-foreground break-words">{chain.description}</p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Created {formatDistanceToNow(new Date(chain.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Link href={`/project/${slug}/chain/${chain.id}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Continue Chain
            </Button>
          </Link>
        </div>

        {/* Chain Visualization */}
        {renders.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Chain Evolution</CardTitle>
              <CardDescription>
                Click on any version to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RenderChainViz
                renders={renders}
                selectedRenderId={selectedRenderId}
                onSelectRender={handleSelectRender}
              />
            </CardContent>
          </Card>
        )}

        {/* Selected Render Details */}
        {selectedRender ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Version {(selectedRender.chainPosition || 0) + 1}</CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(selectedRender.createdAt), { addSuffix: true })}
                  </CardDescription>
                </div>
                <Badge variant={
                  selectedRender.status === 'completed' ? 'default' :
                  selectedRender.status === 'processing' ? 'secondary' :
                  selectedRender.status === 'failed' ? 'destructive' : 'outline'
                }>
                  {selectedRender.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedRender.outputUrl && (
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-border">
                    {selectedRender.type === 'video' ? (
                      <video
                        src={selectedRender.outputUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={selectedRender.outputUrl}
                        alt={selectedRender.prompt}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Prompt</h3>
                  <p className="text-sm text-muted-foreground">{selectedRender.prompt}</p>
                </div>

                {selectedRender.settings && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Settings</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Style:</span>{' '}
                        {selectedRender.settings.style || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality:</span>{' '}
                        {selectedRender.settings.quality || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aspect Ratio:</span>{' '}
                        {selectedRender.settings.aspectRatio || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/project/${slug}/chain/${chain.id}?referenceId=${selectedRender.id}`}>
                    <Button>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Use as Reference
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a version from the chain above to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

