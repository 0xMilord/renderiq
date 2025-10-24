'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  duration?: number;
  status?: 'processing' | 'completed' | 'failed';
  processingTime?: number;
  onRetry?: () => void;
  className?: string;
}

export function VideoPlayer({
  videoUrl,
  title = 'Generated Video',
  duration,
  status = 'completed',
  processingTime,
  onRetry,
  className = ''
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('Failed to load video');
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${title.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'processing') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Processing Video</h3>
              <p className="text-sm text-gray-500">
                Your video is being generated. This may take a few minutes.
              </p>
              {processingTime && (
                <p className="text-xs text-gray-400 mt-1">
                  Processing time: {formatTime(processingTime)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Video Generation Failed</h3>
              <p className="text-sm text-gray-500">
                There was an error generating your video.
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-0">
        {/* Video Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">{title}</h3>
              <Badge className={getStatusColor()}>
                {status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {duration && (
                <span className="text-sm text-gray-500">
                  {formatTime(duration)}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video object-cover"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            muted={isMuted}
            playsInline
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="text-white text-sm">
                {duration && formatTime(duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        {processingTime && (
          <div className="p-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Generated in {formatTime(processingTime)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
