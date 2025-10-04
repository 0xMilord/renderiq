'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Download, 
  Eye, 
  Heart, 
  Share2, 
  Calendar,
  Image as ImageIcon,
  Video,
  Loader2,
  User,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Render } from '@/lib/types/render';
import type { GalleryItemWithDetails } from '@/lib/types';

interface CommonImageCardProps {
  // For gallery items
  galleryItem?: GalleryItemWithDetails;
  // For regular renders
  render?: Render;
  // Display mode
  viewMode?: 'default' | 'compact' | 'list';
  // Actions
  onView?: (item: GalleryItemWithDetails | Render) => void;
  onDownload?: (item: GalleryItemWithDetails | Render) => void;
  onLike?: (item: GalleryItemWithDetails | Render) => void;
  onShare?: (item: GalleryItemWithDetails | Render) => void;
  onRemix?: (item: GalleryItemWithDetails | Render) => void;
  // Display options
  showUser?: boolean;
  showStats?: boolean;
  showActions?: boolean;
}

export function CommonImageCard({ 
  galleryItem,
  render,
  viewMode = 'default',
  onView,
  onDownload,
  onLike,
  onShare,
  onRemix,
  showUser = true,
  showStats = true,
  showActions = true
}: CommonImageCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Determine the data source
  const data = galleryItem || render;
  if (!data) return null;

  const renderData = galleryItem?.render || render;
  const userData = galleryItem?.user;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (url: string) => {
    // This would need to be implemented based on your storage system
    return '2.4 MB';
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 flex-shrink-0">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {imageError ? (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  {renderData.type === 'video' ? (
                    <Video className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              ) : (
                <img
                  src={renderData.outputUrl || ''}
                  alt={renderData.prompt}
                  className={cn(
                    "w-full h-full object-cover rounded-lg",
                    imageLoading && "opacity-0"
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium truncate">{renderData.prompt}</h3>
                <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                  {renderData.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {renderData.type === 'video' ? 'Video' : 'Image'} • {formatFileSize(renderData.outputUrl || '')}
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(renderData.createdAt)}</span>
                </div>
                {renderData.processingTime && (
                  <span>{renderData.processingTime}s</span>
                )}
                {showUser && userData && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{userData.name || 'Anonymous'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView?.(data)}
                  disabled={renderData.status !== 'completed'}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload?.(data)}
                  disabled={renderData.status !== 'completed'}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onLike?.(data)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Like
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare?.(data)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    {onRemix && (
                      <DropdownMenuItem onClick={() => onRemix?.(data)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Remix
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-2">
          <div className="relative aspect-square">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {imageError ? (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                {renderData.type === 'video' ? (
                  <Video className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            ) : (
              <img
                src={renderData.outputUrl || ''}
                alt={renderData.prompt}
                className={cn(
                  "w-full h-full object-cover rounded-lg",
                  imageLoading && "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            <div className="absolute top-2 right-2">
              <Badge className={cn("text-xs", getStatusColor(renderData.status))}>
                {renderData.status}
              </Badge>
            </div>
            {showActions && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onView?.(data)}
                    disabled={renderData.status !== 'completed'}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDownload?.(data)}
                    disabled={renderData.status !== 'completed'}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {showUser && userData && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              by {userData.name || 'Anonymous'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default view
  return (
    <Card className="hover:shadow-lg transition-shadow group py-0">
      <CardContent className="p-0">
        <div className="relative aspect-video rounded-t-xl overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {imageError ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {renderData.type === 'video' ? (
                <Video className="h-12 w-12 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
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
          {showActions && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onView?.(data)}
                  disabled={renderData.status !== 'completed'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDownload?.(data)}
                  disabled={renderData.status !== 'completed'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 rounded-b-xl">
          <h3 className="font-medium text-sm mb-2 line-clamp-2">{renderData.prompt}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(renderData.createdAt)}</span>
              </div>
              {showUser && userData && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{userData.name || 'Anonymous'}</span>
                </div>
              )}
            </div>
            {showStats && galleryItem && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span>{galleryItem.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{galleryItem.views}</span>
                </div>
              </div>
            )}
            {showActions && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike?.(data)}
                  className="h-6 w-6 p-0"
                >
                  <Heart className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShare?.(data)}
                  className="h-6 w-6 p-0"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                {onRemix && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemix?.(data)}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
