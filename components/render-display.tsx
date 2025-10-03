'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Download, Share2, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Render } from '@/lib/db/schema';

interface RenderDisplayProps {
  render: Render;
  onLike?: (renderId: string) => Promise<void>;
  onView?: (renderId: string) => void;
  showActions?: boolean;
}

export function RenderDisplay({ 
  render, 
  onLike, 
  onView, 
  showActions = true 
}: RenderDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Remove automatic view tracking - views should be tracked on user interaction

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleLike = async () => {
    if (onLike) {
      try {
        await onLike(render.id);
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
      } catch (error) {
        console.error('Failed to like render:', error);
      }
    }
  };

  const handleDownload = () => {
    if (render.outputUrl) {
      const link = document.createElement('a');
      link.href = render.outputUrl;
      link.download = `render-${render.id}.${render.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (navigator.share && render.outputUrl) {
      try {
        await navigator.share({
          title: `AI Render - ${render.prompt}`,
          text: `Check out this AI-generated ${render.type}: ${render.prompt}`,
          url: render.outputUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(render.outputUrl || '');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'failed':
        return 'text-destructive bg-destructive/10 dark:bg-destructive/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="bg-card dark:bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg capitalize text-card-foreground">{render.type} Render</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(render.status)}`}>
            {getStatusText(render.status)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{render.prompt}</p>
      </div>

      {/* Content */}
      <div className="relative">
        {render.status === 'completed' && render.outputUrl ? (
          <div className="relative">
            {render.type === 'video' ? (
              <div className="relative">
                <video
                  src={render.outputUrl}
                  className="w-full h-64 object-cover"
                  controls={isPlaying}
                  autoPlay={isPlaying}
                  loop
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={handlePlayPause}
                    size="icon"
                    className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <img
                src={render.outputUrl}
                alt={render.prompt}
                className="w-full h-64 object-cover"
              />
            )}
          </div>
        ) : render.status === 'processing' ? (
          <div className="h-64 flex items-center justify-center bg-muted/50 dark:bg-muted/30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Processing your render...</p>
              {render.processingTime && (
                <p className="text-sm text-muted-foreground mt-1">
                  Processing time: {render.processingTime}s
                </p>
              )}
            </div>
          </div>
        ) : render.status === 'failed' ? (
          <div className="h-64 flex items-center justify-center bg-destructive/10 dark:bg-destructive/20">
            <div className="text-center">
              <div className="text-destructive text-4xl mb-2">⚠️</div>
              <p className="text-destructive">Render failed</p>
              {render.errorMessage && (
                <p className="text-sm text-destructive mt-1">{render.errorMessage}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-muted/50 dark:bg-muted/30">
            <div className="text-center">
              <div className="text-muted-foreground text-4xl mb-2">⏳</div>
              <p className="text-muted-foreground">Render pending...</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && render.status === 'completed' && render.outputUrl && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleLike}
                variant="ghost"
                size="sm"
                className={`flex items-center space-x-1 hover:bg-muted ${
                  isLiked ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </Button>
              <Button
                onClick={() => onView?.(render.id)}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-muted-foreground hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-muted-foreground hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-muted-foreground hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
