'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Eye, User, Loader2, Share2, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';
import { checkUserLiked } from '@/lib/actions/gallery.actions';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

interface GalleryImageCardProps {
  item: GalleryItemWithDetails;
  onLike?: (itemId: string) => Promise<{ success: boolean; data?: { likes: number; liked: boolean }; error?: string }>;
  onView?: (itemId: string) => void;
  priority?: boolean;
}

export function GalleryImageCard({ 
  item, 
  onLike, 
  onView,
  priority = false 
}: GalleryImageCardProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [showUserCard, setShowUserCard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generated' | 'comparison'>('generated');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nextImageRef = useRef<HTMLDivElement | null>(null);
  
  // Robust video type detection - check both string and type
  const isVideo = item.render.type === 'video' || 
                  (typeof item.render.type === 'string' && item.render.type.toLowerCase() === 'video') ||
                  (item.render.outputUrl && (
                    item.render.outputUrl.toLowerCase().endsWith('.mp4') ||
                    item.render.outputUrl.toLowerCase().endsWith('.webm') ||
                    item.render.outputUrl.toLowerCase().endsWith('.mov')
                  ));
  
  // Debug logging for video detection
  useEffect(() => {
    if (item.render.type === 'video' || isVideo) {
      console.log('GalleryImageCard: Video detected', {
        itemId: item.id,
        type: item.render.type,
        outputUrl: item.render.outputUrl,
        isVideo
      });
    }
  }, [item.id, item.render.type, item.render.outputUrl, isVideo]);
  
  // Check if URL is from Supabase or external domain
  const isExternalUrl = item.render.outputUrl 
    ? (item.render.outputUrl.includes('supabase.co') || 
       item.render.outputUrl.includes('http') && !item.render.outputUrl.includes(process.env.NEXT_PUBLIC_SITE_URL || 'renderiq.io'))
    : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if prompt is long enough to likely exceed 3 lines
  // Approximate: ~50-60 characters per line, so ~150-180 chars for 3 lines
  const shouldShowMoreButton = item.render.prompt.length > 150;

  useEffect(() => {
    // Reset loading states when URL changes
    if (!item.render.outputUrl) {
      setImageLoading(false);
      setImageError(true);
      return;
    }

    setImageLoading(true);
    setImageError(false);
    setVideoLoading(true);
    setVideoError(false);
    
    // Set default dimensions (16:9)
    setImageDimensions({ width: 1920, height: 1080 });

    // Aggressive timeout - force show image after 2 seconds regardless
    // This prevents perpetual loading states
    const timeoutId = setTimeout(() => {
      setImageLoading(false);
      setVideoLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [item.render.outputUrl, isVideo]);

  useEffect(() => {
    // Check if user has liked this item
    const fetchLikeStatus = async () => {
      const result = await checkUserLiked(item.id);
      if (result.success && result.data) {
        setIsLiked(result.data.liked);
      }
    };
    fetchLikeStatus();
  }, [item.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onLike) return;
    
    const result = await onLike(item.id);
    if (result.success && result.data) {
      setIsLiked(result.data.liked);
      setLikesCount(result.data.likes);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on user link, like button, or View Image button
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[data-view-image]')) {
      return;
    }
    router.push(`/gallery/${item.id}`);
    if (onView) {
      onView(item.id);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.user) {
      // Use the same URL generation logic as getUsernameUrl to avoid encoding issues
      const url = getUsernameUrl();
      router.push(url);
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.render.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Use original aspect ratio from image dimensions, fallback to 16:9 if not loaded yet
  const displayAspectRatio = imageDimensions 
    ? imageDimensions.width / imageDimensions.height 
    : 16/9;

  // Generate username URL: just username (slugified name)
  const getUsernameUrl = () => {
    if (!item.user) return '#';
    const username = (item.user.name || 'user')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `/${username}`;
  };

  // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (!item.user) return 'U';
    const name = item.user.name || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Format date for display - only calculate relative time after mount to avoid hydration mismatch
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!mounted) {
      // Return a stable format during SSR
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    const d = dateObj;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Header - User info */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        {item.user && (
          <div className="relative flex-1">
            <Link
              href={getUsernameUrl()}
              onClick={handleUserClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onMouseEnter={() => setShowUserCard(true)}
              onMouseLeave={() => setShowUserCard(false)}
            >
            {item.user.avatar && !avatarError ? (
              <div className="relative w-8 h-8 shrink-0 max-w-[32px] max-h-[32px] overflow-hidden rounded-full">
                <Image
                  src={item.user.avatar}
                  alt={item.user.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-full h-full"
                  style={{ maxWidth: '32px', maxHeight: '32px' }}
                  unoptimized={item.user.avatar.includes('dicebear.com')}
                  onError={() => setAvatarError(true)}
                />
              </div>
            ) : (
              <div className="w-8 h-8 shrink-0 max-w-[32px] max-h-[32px] rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                {getUserInitials()}
              </div>
            )}
            <span className="text-sm font-semibold text-foreground">
              {item.user.name || 'Anonymous'}
            </span>
          </Link>
          
          {/* User Info Card - Positioned relative to link, stays visible when hovering over it */}
          {showUserCard && (
            <div 
              className="absolute top-full left-0 mt-2 z-50 w-72 bg-card border border-border rounded-lg shadow-xl p-4 pointer-events-auto"
              onMouseEnter={() => setShowUserCard(true)}
              onMouseLeave={() => setShowUserCard(false)}
            >
              <div className="flex items-start gap-3 mb-3">
                {item.user.avatar && !avatarError ? (
                  <div className="relative w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] overflow-hidden rounded-full ring-2 ring-primary/20">
                    <Image
                      src={item.user.avatar}
                      alt={item.user.name || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                      style={{ maxWidth: '48px', maxHeight: '48px' }}
                      unoptimized={item.user.avatar.includes('dicebear.com')}
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-base ring-2 ring-primary/20">
                    {getUserInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base mb-1 truncate">{item.user.name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground mb-2">@{getUsernameUrl().replace('/', '')}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{item.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{item.likes} likes</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <Link
                  href={getUsernameUrl()}
                  onClick={handleUserClick}
                  className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                  View full profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0"
          data-view-image
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `/gallery/${item.id}`;
            router.push(url);
            if (onView) {
              onView(item.id);
            }
          }}
        >
          <Eye className="h-3 w-3 mr-1.5 shrink-0" />
          View Image
        </Button>
      </div>

      {/* Image/Video Container - With Tabs if uploaded image exists (ONLY for images, NEVER for videos) */}
      {item.render.uploadedImageUrl && item.render.outputUrl && !isVideo ? (
        <div className="relative w-full">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generated' | 'comparison')} className="w-full">
            <TabsList className="absolute top-2 left-2 z-20 grid w-auto grid-cols-2 bg-black/70 text-white">
              <TabsTrigger 
                value="generated" 
                className="data-[state=active]:bg-white/20 text-xs px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                Generated
              </TabsTrigger>
              <TabsTrigger 
                value="comparison" 
                className="data-[state=active]:bg-white/20 text-xs px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                Compare
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="generated" className="mt-0">
            <div 
              className="relative w-full overflow-hidden bg-muted cursor-pointer"
              onClick={handleCardClick}
              style={{
                aspectRatio: displayAspectRatio,
              }}
            >
              {imageLoading && !isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {videoError && isVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <p className="text-muted-foreground text-sm">Failed to load video</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoError(false);
                        setVideoLoading(true);
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : isVideo && item.render.outputUrl ? (
                <>
                  {videoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <video
                    src={item.render.outputUrl}
                    className={cn(
                      "w-full h-full object-contain transition-opacity duration-300",
                      videoLoading ? "opacity-0" : "opacity-100"
                    )}
                    controls={false}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    crossOrigin="anonymous"
                    onLoadedMetadata={(e) => {
                      console.log('Video metadata loaded:', item.render.outputUrl);
                      setVideoLoading(false);
                      setVideoError(false);
                    }}
                    onCanPlay={(e) => {
                      console.log('Video can play:', item.render.outputUrl);
                      setVideoLoading(false);
                      setVideoError(false);
                    }}
                    onLoadedData={(e) => {
                      console.log('Video data loaded:', item.render.outputUrl);
                      setVideoLoading(false);
                      setVideoError(false);
                    }}
                    onError={(e) => {
                      const video = e.currentTarget;
                      const error = video.error;
                      console.error('Video load error:', {
                        code: error?.code,
                        message: error?.message,
                        url: item.render.outputUrl,
                        networkState: video.networkState,
                        readyState: video.readyState
                      });
                      setVideoError(true);
                      setVideoLoading(false);
                    }}
                    onMouseEnter={(e) => {
                      if (!isVideoPlaying && !videoError) {
                        e.currentTarget.play().catch((err) => {
                          console.error('Video play error:', err);
                        });
                        setIsVideoPlaying(true);
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                      setIsVideoPlaying(false);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = e.currentTarget;
                      if (video.paused) {
                        video.play().catch((err) => {
                          console.error('Video play error:', err);
                        });
                        setIsVideoPlaying(true);
                      } else {
                        video.pause();
                        setIsVideoPlaying(false);
                      }
                    }}
                  />
                </>
              ) : imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-muted-foreground text-sm">Failed to load</p>
                  </div>
                </div>
              ) : item.render.outputUrl ? (
                <>
                  {/* Use regular img tag - more reliable for external URLs */}
                  <img
                    ref={imageRef}
                    src={item.render.outputUrl}
                    alt={item.render.prompt || 'AI-generated architectural render'}
                    className={cn(
                      "w-full h-full object-contain transition-opacity duration-300",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => {
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    loading={priority ? "eager" : "lazy"}
                  />
                </>
              ) : (
                // No outputUrl - show placeholder
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-muted-foreground text-sm">No image available</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-0">
            {/* Only show comparison for images, never for videos */}
            {!isVideo ? (
              <div 
                className="relative w-full overflow-hidden bg-muted"
                style={{
                  aspectRatio: displayAspectRatio,
                }}
                onClick={(e) => {
                  // Prevent navigation when interacting with the slider
                  e.stopPropagation();
                }}
              >
                <ReactBeforeSliderComponent
                  firstImage={{ imageUrl: item.render.uploadedImageUrl }}
                  secondImage={{ imageUrl: item.render.outputUrl }}
                  currentPercentPosition={75}
                />
                {/* Labels - Bottom corners to avoid clashing with tabs */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium z-10">
                  Before
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium z-10">
                  After
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground text-sm">Comparison not available for videos</p>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div 
          className="relative w-full overflow-hidden bg-muted cursor-pointer"
          onClick={handleCardClick}
          style={{
            aspectRatio: displayAspectRatio,
          }}
        >
          {(imageLoading || videoLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {imageError || videoError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">{isVideo ? '🎬' : '🖼️'}</div>
                <p className="text-muted-foreground text-sm">Failed to load</p>
              </div>
            </div>
          ) : isVideo && item.render.outputUrl ? (
            <>
              <video
                src={item.render.outputUrl}
                className={cn(
                  "w-full h-full object-contain transition-opacity duration-300",
                  videoLoading ? "opacity-0" : "opacity-100"
                )}
                controls={false}
                loop
                muted
                playsInline
                onLoadedMetadata={() => {
                  setVideoLoading(false);
                }}
                onError={() => {
                  setVideoError(true);
                  setVideoLoading(false);
                }}
                onMouseEnter={(e) => {
                  if (!isVideoPlaying) {
                    e.currentTarget.play();
                    setIsVideoPlaying(true);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                  setIsVideoPlaying(false);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play();
                    setIsVideoPlaying(true);
                  } else {
                    video.pause();
                    setIsVideoPlaying(false);
                  }
                }}
              />
              {/* Video play indicator */}
              {!isVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              )}
            </>
          ) : item.render.outputUrl ? (
            <>
              {/* Always use regular img tag for Supabase/external URLs - more reliable */}
              <img
                ref={imageRef}
                src={item.render.outputUrl}
                alt={item.render.prompt || 'AI-generated architectural render'}
                className={cn(
                  "w-full h-full object-contain transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => {
                  setImageLoading(false);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                loading={priority ? "eager" : "lazy"}
              />
            </>
          ) : (
            // No outputUrl - show placeholder
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-muted-foreground text-sm">No image available</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Section */}
      <div className="px-4 py-3 space-y-2">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "transition-colors",
                isLiked ? "text-red-500" : "text-foreground hover:text-red-500"
              )}
            >
              <Heart className={cn(
                "h-6 w-6",
                isLiked && "fill-current"
              )} />
            </button>
            <button className="text-foreground hover:text-muted-foreground transition-colors">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <button 
            onClick={handleCardClick}
            className="text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1"
            title={`${item.views} views`}
          >
            <Eye className="h-6 w-6" />
            <span className="text-sm font-medium">{item.views}</span>
          </button>
        </div>

        {/* Likes Count */}
        <div className="text-sm font-semibold text-foreground">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </div>

        {/* Caption */}
        <div className="text-sm">
          {item.user && (
            <Link
              href={getUsernameUrl()}
              onClick={handleUserClick}
              className="font-semibold text-foreground hover:opacity-80 mr-2"
            >
              {item.user.name || 'Anonymous'}
            </Link>
          )}
          <div className="inline-block w-full">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "text-foreground flex-1",
                  !isPromptExpanded && "line-clamp-3"
                )}
              >
                {item.render.prompt}
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            {shouldShowMoreButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPromptExpanded(!isPromptExpanded);
                }}
                className="text-muted-foreground hover:text-foreground mt-1 font-medium transition-colors"
              >
                {isPromptExpanded ? ' show less' : '... show more'}
              </button>
            )}
          </div>
        </div>

        {/* Metadata as Tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {isVideo && (
            <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
              🎬 Video
            </Badge>
          )}
          {item.render.settings?.style && (
            <Badge variant="secondary" className="text-xs capitalize">
              {item.render.settings.style}
            </Badge>
          )}
          {item.render.settings?.quality && (
            <Badge variant="secondary" className="text-xs capitalize">
              {item.render.settings.quality}
            </Badge>
          )}
          {item.render.settings?.aspectRatio && (
            <Badge variant="secondary" className="text-xs">
              {item.render.settings.aspectRatio}
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {formatDate(item.createdAt)}
        </div>
      </div>

    </div>
  );
}

