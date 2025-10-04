'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Download, 
  Heart, 
  Share2, 
  Calendar,
  User,
  Copy,
  RefreshCw,
  Loader2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Render } from '@/lib/types/render';
import type { GalleryItemWithDetails } from '@/lib/types';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItemWithDetails | Render | null;
  onLike?: (item: GalleryItemWithDetails | Render) => void;
  onShare?: (item: GalleryItemWithDetails | Render) => void;
  onRemix?: (prompt: string) => void;
  onDownload?: (item: GalleryItemWithDetails | Render) => void;
}

export function ImageModal({
  isOpen,
  onClose,
  item,
  onLike,
  onShare,
  onRemix,
  onDownload
}: ImageModalProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState('');

  if (!item) return null;

  const renderData = 'render' in item ? item.render : item;
  const userData = 'user' in item ? item.user : null;
  const isGalleryItem = 'render' in item;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleRemix = async () => {
    if (!onRemix || !remixPrompt.trim()) return;
    
    setIsRemixing(true);
    try {
      await onRemix(remixPrompt);
      onClose();
    } catch (error) {
      console.error('Failed to remix:', error);
    } finally {
      setIsRemixing(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(renderData.prompt);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 overflow-hidden"
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-xl font-semibold">
              {renderData.type === 'video' ? 'Video' : 'Image'} Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto">
          {/* Image/Video Display */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-muted-foreground">Failed to load image</p>
                  </div>
                </div>
              ) : (
                <img
                  src={renderData.outputUrl || ''}
                  alt={renderData.prompt}
                  className={cn(
                    "w-full h-full object-cover",
                    imageLoading && "opacity-0"
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              <div className="absolute top-3 right-3">
                <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                  {renderData.status}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload?.(item)}
                disabled={renderData.status !== 'completed'}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLike?.(item)}
              >
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare?.(item)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Details Panel */}
          <div className="space-y-6">
            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPrompt}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{renderData.prompt}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(renderData.createdAt)}</span>
                </div>
                {userData && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Author:</span>
                    <span>{userData.name || 'Anonymous'}</span>
                  </div>
                )}
                {isGalleryItem && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Likes:</span>
                      <span>{item.likes}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Views:</span>
                      <span>{item.views}</span>
                    </div>
                  </>
                )}
                {renderData.processingTime && (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Processing time:</span>
                    <span>{renderData.processingTime}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remix Section */}
            {onRemix && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Remix</h3>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Modify the prompt to create a new variation..."
                    value={remixPrompt}
                    onChange={(e) => setRemixPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleRemix}
                    disabled={!remixPrompt.trim() || isRemixing}
                    className="w-full"
                  >
                    {isRemixing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Remix...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Create Remix
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
