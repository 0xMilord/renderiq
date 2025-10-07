'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const hasComparison = !!(renderData.uploadedImageUrl && renderData.outputUrl);

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
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-4 lg:p-6 shadow-lg duration-200 overflow-hidden"
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-y-auto">
          {/* Image/Video Display - 3/4 width on desktop, full width on mobile */}
          <div className="lg:col-span-3 space-y-4">
            {hasComparison ? (
              <Tabs defaultValue="generated" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="uploaded">Before (Uploaded)</TabsTrigger>
                  <TabsTrigger value="generated">After (Generated)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="uploaded" className="mt-0">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
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
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={renderData.uploadedImageUrl || ''}
                        alt="Uploaded image"
                        className="w-full h-full object-contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                    <div className="absolute top-3 right-3 z-30">
                      <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                        {renderData.status}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="generated" className="mt-0">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
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
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={renderData.outputUrl || ''}
                        alt="Generated image"
                        className="w-full h-full object-contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    )}
                    <div className="absolute top-3 right-3 z-30">
                      <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                        {renderData.status}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-20">
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
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={renderData.outputUrl || ''}
                    alt={renderData.prompt}
                    className="w-full h-full object-contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
                <div className="absolute top-3 right-3 z-30">
                  <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                    {renderData.status}
                  </Badge>
                </div>
              </div>
            )}

          </div>

          {/* Details Panel - 1/4 width on desktop, full width on mobile */}
          <div className="lg:col-span-1 space-y-4">
            {/* Render Settings */}
            {renderData.settings && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Settings</h3>
                <div className="flex flex-wrap gap-1">
                  {renderData.settings.style && (
                    <Badge variant="secondary" className="text-xs">
                      {renderData.settings.style}
                    </Badge>
                  )}
                  {renderData.settings.quality && (
                    <Badge variant="secondary" className="text-xs">
                      {renderData.settings.quality}
                    </Badge>
                  )}
                  {renderData.settings.aspectRatio && (
                    <Badge variant="secondary" className="text-xs">
                      {renderData.settings.aspectRatio}
                    </Badge>
                  )}
                  {renderData.settings.duration && (
                    <Badge variant="secondary" className="text-xs">
                      {renderData.settings.duration}s
                    </Badge>
                  )}
                  {renderData.settings.negativePrompt && (
                    <Badge variant="outline" className="text-xs">
                      Negative
                    </Badge>
                  )}
                  {renderData.settings.renderMode && (
                    <Badge variant="outline" className="text-xs">
                      {renderData.settings.renderMode}
                    </Badge>
                  )}
                  {renderData.type && (
                    <Badge variant="outline" className="text-xs">
                      {renderData.type}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Prompt</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPrompt}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-xs leading-relaxed">{renderData.prompt}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(renderData.createdAt)}</span>
                </div>
                {userData && (
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Author:</span>
                    <span>{userData.name || 'Anonymous'}</span>
                  </div>
                )}
                {isGalleryItem && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Likes:</span>
                      <span>{item.likes}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Views:</span>
                      <span>{item.views}</span>
                    </div>
                  </>
                )}
                {renderData.processingTime && (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span>{renderData.processingTime}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remix Section */}
            {onRemix && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Remix</h3>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Modify the prompt..."
                    value={remixPrompt}
                    onChange={(e) => setRemixPrompt(e.target.value)}
                    className="min-h-[60px] text-xs"
                  />
                  <Button
                    onClick={handleRemix}
                    disabled={!remixPrompt.trim() || isRemixing}
                    className="w-full h-8 text-xs"
                  >
                    {isRemixing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Remix
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload?.(item)}
                  disabled={renderData.status !== 'completed'}
                  className="h-8 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLike?.(item)}
                  className="h-8 text-xs"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Like
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShare?.(item)}
                  className="h-8 text-xs"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
