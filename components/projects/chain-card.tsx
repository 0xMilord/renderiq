'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Eye, 
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { RenderChain, Render } from '@/lib/db/schema';

interface ChainCardProps {
  chain: RenderChain & { 
    renders?: Render[];
  };
  projectSlug?: string;
  viewMode: 'default' | 'compact' | 'list';
  onSelect?: (chainId: string) => void;
}

function ChainCardComponent({ 
  chain, 
  projectSlug,
  viewMode,
  onSelect
}: ChainCardProps) {
  const renders = chain.renders || [];
  const validRenders = renders.filter(r => r.status !== 'failed' && r.outputUrl);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toSentenceCase = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const renderImageGrid = () => {
    if (validRenders.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    }

    // Show 4 versions in a row with link icons between them
    const maxDisplayImages = 4;
    const imagesToShow = validRenders.slice(0, maxDisplayImages);
    const remainingCount = Math.max(0, renders.length - imagesToShow.length);

    return (
      <div className="w-full h-full flex items-center justify-center gap-2">
        {imagesToShow.map((render, index) => (
          <React.Fragment key={render.id}>
            <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded-md overflow-hidden border border-border">
              {render.outputUrl ? (
                <img
                  src={render.outputUrl}
                  alt={`Render ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {render.type === 'video' ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
              {/* Show +N overlay on the 4th image if there are more renders */}
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
            {/* Show link icon between images (not after the last one) */}
            {index < imagesToShow.length - 1 && (
              <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
        {/* If no renders, show placeholder */}
        {imagesToShow.length === 0 && (
          <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(chain.id);
    }
  };

  // Always use proper route structure - if no projectSlug, we need to get it from chain
  // For now, fallback to query param route which will redirect properly
  const chainUrl = projectSlug 
    ? `/project/${projectSlug}/chain/${chain.id}`
    : `/render?chain=${chain.id}`;

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="w-full h-full bg-muted rounded-md overflow-hidden">
                {renderImageGrid()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{toSentenceCase(chain.name)}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {chain.description || 'No description'}
              </p>
              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{formatDate(chain.createdAt)}</span>
                </div>
                <span>{renders.length} render{renders.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-[0.55] h-8"
                asChild
                title="View"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={chainUrl}>
                  <Eye className="h-3 w-3 mr-1.5" />
                  View
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default and compact view
  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-200 flex flex-col gap-0 cursor-pointer",
        viewMode === 'compact' ? "" : "h-full"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "bg-muted relative group flex-shrink-0 rounded-t-lg overflow-hidden",
        viewMode === 'compact' ? "aspect-square" : "aspect-video"
      )}>
        <div className="w-full h-full p-1">
          {renderImageGrid()}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={chainUrl}>
                <Eye className="h-3 w-3 mr-1.5" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2 flex-shrink-0 gap-0 px-6 pt-6">
        <CardTitle className={cn(
          "text-sm",
          viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
        )}>{toSentenceCase(chain.name)}</CardTitle>
        <CardDescription className={cn(
          "text-xs",
          viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
        )}>
          {chain.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <div className="px-6">
        <div className="border-t border-border"></div>
      </div>
      <CardContent className="pt-4 flex-shrink-0 px-6 pb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-[0.55] h-8"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={chainUrl}>
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </Link>
          </Button>
          <div className="flex-[0.45] flex items-center justify-end space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(chain.createdAt)}</span>
            </div>
            <span>{renders.length} render{renders.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ChainCard = React.memo(ChainCardComponent);

