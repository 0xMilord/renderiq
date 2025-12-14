'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  MoreVertical,
  Edit,
  Copy,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { RenderChain, Render } from '@/lib/db/schema';
import { EditChainModal } from './edit-chain-modal';
import { DuplicateChainModal } from './duplicate-chain-modal';
import { DeleteChainDialog } from './delete-chain-dialog';
import { deleteRenderChain } from '@/lib/actions/projects.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { TldrawSnapshotImage } from '@/components/canvas/tldraw-snapshot-image';
import type { TLStoreSnapshot } from '@tldraw/tldraw';

interface ChainCardProps {
  chain: RenderChain & { 
    renders?: Render[];
    projectId?: string;
  };
  projectSlug?: string;
  projects?: Array<{ id: string; slug: string }>; // Optional projects array to lookup slug
  viewMode: 'default' | 'compact' | 'list';
  onSelect?: (chainId: string) => void;
  onEdit?: (chain: RenderChain) => void;
  onDuplicate?: (chain: RenderChain) => void;
  onDelete?: (chain: RenderChain) => void;
}

function ChainCardComponent({ 
  chain, 
  projectSlug,
  projects,
  viewMode,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete
}: ChainCardProps) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const renders = chain.renders || [];
  const validRenders = renders.filter(r => r.status !== 'failed' && r.outputUrl);

  // ✅ Get tldraw snapshot from latest render's contextData
  const chainSnapshot = React.useMemo(() => {
    if (!renders || renders.length === 0) return null;
    
    // Get latest render (highest chainPosition, or most recent if no position)
    const latestRender = renders
      .sort((a, b) => {
        const posA = (a as any).chainPosition ?? -1;
        const posB = (b as any).chainPosition ?? -1;
        if (posA !== posB) return posB - posA;
        const dateA = new Date((a as any).createdAt).getTime();
        const dateB = new Date((b as any).createdAt).getTime();
        return dateB - dateA;
      })[0];

    const contextData = (latestRender as any).contextData;
    const canvasState = contextData?.tldrawCanvasState;
    return canvasState?.canvasData as TLStoreSnapshot | null | undefined;
  }, [renders]);

  // Get projectSlug from projects array if not provided
  const effectiveProjectSlug = React.useMemo(() => {
    if (projectSlug) return projectSlug;
    if (projects && chain.projectId) {
      const project = projects.find(p => p.id === chain.projectId);
      return project?.slug;
    }
    return undefined;
  }, [projectSlug, projects, chain.projectId]);

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
    // ✅ PRIORITY: Show tldraw snapshot if available (Figma-style preview)
    if (chainSnapshot) {
      return (
        <div className="w-full h-32 sm:h-40 flex items-center justify-center bg-muted rounded-md overflow-hidden border border-border">
          <TldrawSnapshotImage
            snapshot={chainSnapshot}
            width={400}
            height={160}
            format="png"
            className="w-full h-full"
          />
        </div>
      );
    }

    // Fallback: Show render images if no snapshot available
    if (validRenders.length === 0) {
      return (
        <div className="w-full py-4 flex items-center justify-center bg-muted rounded">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    }

    // Show 4 versions in a row with link icons between them
    const maxDisplayImages = 4;
    const imagesToShow = validRenders.slice(0, maxDisplayImages);
    const remainingCount = Math.max(0, renders.length - imagesToShow.length);

    return (
      <div className="w-full py-2 flex items-center justify-center gap-2">
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
                  suppressHydrationWarning
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

  const handleImageClick = () => {
    if (onSelect) {
      onSelect(chain.id);
    } else {
      // Navigate to chain detail page - always use proper URL structure
      if (effectiveProjectSlug) {
        window.location.href = `/project/${effectiveProjectSlug}/chain/${chain.id}`;
      } else {
        // Fallback: redirect through /render?chain= which will redirect properly
        window.location.href = `/render?chain=${chain.id}`;
      }
    }
  };

  // Always use proper route structure
  const chainUrl = effectiveProjectSlug 
    ? `/project/${effectiveProjectSlug}/chain/${chain.id}`
    : `/render?chain=${chain.id}`; // Fallback - will redirect to proper URL

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div 
              className="relative w-12 h-12 flex-shrink-0 cursor-pointer"
              onClick={handleImageClick}
            >
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
                className="h-8"
                asChild
                title="Continue"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={chainUrl}>
                  <MessageSquare className="h-3 w-3 mr-1.5" />
                  Continue
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title="More options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDuplicateModalOpen(true);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        "group hover:shadow-lg transition-all duration-200 flex flex-col gap-0"
      )}
    >
      <div className={cn(
        "bg-muted relative group flex-shrink-0 rounded-t-lg overflow-hidden"
      )}>
        <div 
          className="w-full p-1 cursor-pointer"
          onClick={handleImageClick}
        >
          {renderImageGrid()}
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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={chainUrl}>
                <MessageSquare className="h-3 w-3 mr-1.5" />
                Continue
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  title="More options"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDuplicateModalOpen(true);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(chain.createdAt)}</span>
              </div>
              <span>{renders.length} render{renders.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <EditChainModal
        chain={chain}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onChainUpdated={(updatedChain) => {
          if (onEdit) {
            onEdit(updatedChain);
          }
          router.refresh();
        }}
      />
      <DuplicateChainModal
        chain={chain}
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        onChainDuplicated={(duplicatedChain) => {
          if (onDuplicate) {
            onDuplicate(duplicatedChain);
          }
          router.refresh();
        }}
      />
      <DeleteChainDialog
        chain={chain}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          const result = await deleteRenderChain(chain.id);
          if (result.success) {
            toast.success('Chain deleted successfully');
            if (onDelete) {
              onDelete(chain);
            }
            router.refresh();
          } else {
            toast.error(result.error || 'Failed to delete chain');
          }
        }}
      />
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ChainCard = React.memo(ChainCardComponent);

