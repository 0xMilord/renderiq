'use client';

import { useState, useEffect, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Eye, User, Loader2, Share2, Copy, Check, Calendar } from 'lucide-react';
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
  hideOwnerInfo?: boolean; // Hide user info when viewing owner's profile
  isLiked?: boolean; // Pre-computed liked status from parent (optional, falls back to checking)
}

function GalleryImageCardComponent({ 
  item, 
  onLike, 
  onView,
  priority = false,
  hideOwnerInfo = false,
  isLiked: initialIsLiked
}: GalleryImageCardProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? false);
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
  
  // ✅ REACT 19 OPTIMIZED: Memoize derived values instead of calculating on every render
  // Check if URL is from external storage (Supabase or GCS)
  const isExternalUrl = useMemo(() => {
    if (!item.render.outputUrl) return false;
    return item.render.outputUrl.includes('supabase.co') || 
           item.render.outputUrl.includes('storage.googleapis.com') ||
           item.render.outputUrl.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '') ||
           (item.render.outputUrl.includes('http') && !item.render.outputUrl.includes(process.env.NEXT_PUBLIC_SITE_URL || 'renderiq.io'));
  }, [item.render.outputUrl]);
  
  // Debug logging for video detection (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && (item.render.type === 'video' || isVideo)) {
      console.log('GalleryImageCard: Video detected', {
        itemId: item.id,
        type: item.render.type,
        outputUrl: item.render.outputUrl,
        isVideo
      });
    }
  }, [item.id, item.render.type, item.render.outputUrl, isVideo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ REACT 19 OPTIMIZED: Memoize derived values
  // Check if prompt is long enough to likely exceed 3 lines
  // Approximate: ~50-60 characters per line, so ~150-180 chars for 3 lines
  const shouldShowMoreButton = useMemo(() => item.render.prompt.length > 150, [item.render.prompt.length]);

  // Check if image was generated with a tool/app (hide prompts for these)
  // Multiple detection methods to ensure we catch all tool-generated images
  const isToolGenerated = useMemo(() => {
    // Method 1: Check if tool object exists (from toolExecutions join)
    if (item.tool?.id) {
      return true;
    }
    
    // Method 2: Check if prompt contains system prompt patterns (leaked system prompts)
    const prompt = item.render.prompt || '';
    const systemPromptPatterns = [
      /<role>/i,
      /<task>/i,
      /<constraints>/i,
      /<output_requirements>/i,
      /<context>/i,
      /You are an expert/i,
      /Transform this/i,
      /architectural draftsman/i,
      /3D axonometric/i,
      /isometric diagram/i,
      /floor plan/i,
    ];
    
    // If prompt contains system prompt patterns, it's likely a tool-generated image
    if (systemPromptPatterns.some(pattern => pattern.test(prompt))) {
      return true;
    }
    
    // Method 3: Check render settings for tool indicators
    const settings = item.render.settings as any;
    if (settings?.imageType || settings?.toolId || settings?.toolSlug) {
      return true;
    }
    
    return false;
  }, [item.tool?.id, item.render.prompt, item.render.settings]);

  // Get tool information from item.tool (from DAL) or fallback to render settings
  const toolName = useMemo(() => {
    // First try to get from tool object (from DAL join)
    if (item.tool?.name) {
      return item.tool.name;
    }
    // Fallback to render settings (for legacy data)
    const toolId = (item.render.settings as any)?.imageType;
    if (toolId) {
      return toolId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return null;
  }, [item.tool, item.render.settings]);

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

  // Use ref to prevent duplicate calls
  const likeStatusCheckedRef = useRef(false);
  
  // ✅ FIXED: Sync liked status from prop or item data
  // Always sync with prop when it changes (prop is source of truth from hook)
  useEffect(() => {
    // Priority: initialIsLiked prop (from likedItems set) > item.liked (if exists) > check server
    if (initialIsLiked !== undefined) {
      setIsLiked(initialIsLiked);
      likeStatusCheckedRef.current = true;
      return;
    }
    
    // Check if item has liked property (from server)
    if ('liked' in item && typeof (item as any).liked === 'boolean') {
      setIsLiked((item as any).liked);
      likeStatusCheckedRef.current = true;
      return;
    }
    
    // Only check server if not already checked and not provided
    if (likeStatusCheckedRef.current) return;
    
    const fetchLikeStatus = async () => {
      likeStatusCheckedRef.current = true;
      try {
        const result = await checkUserLiked(item.id);
        if (result.success && result.data) {
          setIsLiked(result.data.liked);
        }
      } catch (err) {
        console.error('Failed to check like status:', err);
        likeStatusCheckedRef.current = false; // Allow retry on error
      }
    };
    fetchLikeStatus();
  }, [item.id, initialIsLiked, item]);
  
  // ✅ FIXED: Sync likes count with item.likes when it changes (from hook's items array update)
  useEffect(() => {
    setLikesCount(item.likes);
  }, [item.likes]);

  // ✅ FIXED: Prevent rapid clicks with a ref
  const isLikingRef = useRef(false);
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onLike || isLikingRef.current) return; // Prevent rapid clicks
    
    // ✅ OPTIMISTIC UPDATE: Update UI immediately before server response
    const previousLiked = isLiked;
    const previousCount = likesCount;
    const newLiked = !previousLiked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);
    
    setIsLiked(newLiked);
    setLikesCount(newCount);
    isLikingRef.current = true;
    
    try {
      // Then call the server action
      const result = await onLike(item.id);
      
      // ✅ FIXED: Always sync with server response to prevent state desync
      if (result.success && result.data) {
        // Server response is the source of truth
        setIsLiked(result.data.liked);
        setLikesCount(result.data.likes);
      } else {
        // ✅ ROLLBACK on error: Revert optimistic update if server call failed
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
      }
    } finally {
      isLikingRef.current = false;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on user link, like button, or View Image button
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('[data-view-image]')) {
      return;
    }
    // Save scroll position before navigating
    if (typeof window !== 'undefined' && window.location.pathname === '/gallery') {
      sessionStorage.setItem('gallery-scroll-position', window.scrollY.toString());
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

  // ✅ REACT 19 OPTIMIZED: Memoize derived values
  // Use original aspect ratio from image dimensions, fallback to 16:9 if not loaded yet
  // Cap maximum aspect ratio at 16:9 to prevent overflow for very wide images
  const displayAspectRatio = useMemo(() => {
    const ratio = imageDimensions 
      ? imageDimensions.width / imageDimensions.height 
      : 16/9;
    // Cap at 16:9 (1.778) to prevent overflow - wider images will be constrained
    return Math.min(ratio, 16/9);
  }, [imageDimensions]);

  // ✅ REACT 19 OPTIMIZED: Memoize derived values
  // Generate username URL: just username (slugified name)
  const usernameUrl = useMemo(() => {
    if (!item.user) return '#';
    const username = (item.user.name || 'user')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `/u/${username}`;
  }, [item.user?.name]);

  // Get user initials for fallback avatar
  const userInitials = useMemo(() => {
    if (!item.user) return 'U';
    const name = item.user.name || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }, [item.user?.name]);
  
  // Keep function for backward compatibility with existing code
  const getUsernameUrl = () => usernameUrl;
  const getUserInitials = () => userInitials;

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
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 w-full max-w-full">
      {/* Header - User info (hidden when hideOwnerInfo is true) */}
      {!hideOwnerInfo && (
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
                  <div className="relative w-8 h-8 shrink-0 max-w-[32px] max-h-[32px] overflow-hidden rounded-md border border-border">
                    <Image
                      src={item.user.avatar}
                      alt={item.user.name || 'User'}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      style={{ maxWidth: '32px', maxHeight: '32px' }}
                      unoptimized={item.user.avatar.includes('dicebear.com')}
                      onError={() => setAvatarError(true)}
                    />
                    {item.user.isPro && (
                      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-primary flex items-center justify-center">
                        <span className="text-[6px] font-bold text-primary-foreground leading-none">PRO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-8 h-8 shrink-0 max-w-[32px] max-h-[32px] rounded-md bg-primary/20 border border-border flex items-center justify-center text-primary font-semibold text-xs">
                    {getUserInitials()}
                    {item.user.isPro && (
                      <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-primary flex items-center justify-center">
                        <span className="text-[6px] font-bold text-primary-foreground leading-none">PRO</span>
                      </div>
                    )}
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
                      <div className="relative w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] overflow-hidden rounded-md border-2 border-primary/20">
                        <Image
                          src={item.user.avatar}
                          alt={item.user.name || 'User'}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          style={{ maxWidth: '48px', maxHeight: '48px' }}
                          unoptimized={item.user.avatar.includes('dicebear.com')}
                          onError={() => setAvatarError(true)}
                        />
                        {item.user.isPro && (
                          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-primary flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary-foreground leading-none">PRO</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] rounded-md bg-primary/20 border-2 border-primary/20 flex items-center justify-center text-primary font-semibold text-base">
                        {getUserInitials()}
                        {item.user.isPro && (
                          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-primary flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary-foreground leading-none">PRO</span>
                          </div>
                        )}
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
      )}

      {/* Image/Video Container - With Tabs if uploaded image exists (ONLY for images, NEVER for videos) */}
      {item.render.uploadedImageUrl && item.render.outputUrl && !isVideo ? (
        <div className="relative w-full">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'generated' | 'comparison')} 
            className="w-full"
          >
            <TabsList className="absolute top-2 left-2 z-20 grid w-auto grid-cols-2 bg-background/90 backdrop-blur-sm border border-border text-foreground">
              <TabsTrigger 
                value="generated" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                Generated
              </TabsTrigger>
              <TabsTrigger 
                value="comparison" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                Compare
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="generated" className="mt-0">
            <div 
              className="relative w-full max-w-full overflow-hidden bg-muted cursor-pointer"
              onClick={handleCardClick}
              style={{
                aspectRatio: displayAspectRatio,
                maxWidth: '100%',
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
                      "w-full h-full max-w-full max-h-full object-contain transition-opacity duration-300",
                      videoLoading ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
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
                      "w-full h-full max-w-full max-h-full object-contain transition-opacity duration-300",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
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
                className="relative w-full max-w-full overflow-hidden bg-muted flex items-center justify-center"
                style={{
                  maxHeight: '600px',
                  minHeight: '300px',
                  maxWidth: '100%',
                }}
                onClick={(e) => {
                  // Prevent navigation when interacting with the slider
                  e.stopPropagation();
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  .gallery-card-slider-wrapper .react-before-after-slider-container {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    max-height: 600px !important;
                    position: relative !important;
                    overflow: visible !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                  }
                  .gallery-card-slider-wrapper .react-before-after-slider-container > div {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    position: relative !important;
                  }
                  .gallery-card-slider-wrapper .react-before-after-slider-container img,
                  .gallery-card-slider-wrapper .react-before-after-slider-container picture img {
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    max-height: 600px !important;
                    object-fit: contain !important;
                    object-position: center !important;
                    box-sizing: border-box !important;
                    display: block !important;
                  }
                `}} />
                <div className="gallery-card-slider-wrapper w-full">
                  <ReactBeforeSliderComponent
                    firstImage={{ imageUrl: item.render.outputUrl }}
                    secondImage={{ imageUrl: item.render.uploadedImageUrl }}
                    currentPercentPosition={75}
                  />
                </div>
                {/* Labels - Bottom corners: Before on left (uploaded image), After on right (generated image) */}
                <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
                  Before
                </div>
                <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm border border-border text-foreground px-2 py-1 rounded text-xs font-medium z-10">
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
          className="relative w-full max-w-full overflow-hidden bg-muted cursor-pointer"
          onClick={handleCardClick}
          style={{
            aspectRatio: displayAspectRatio,
            maxWidth: '100%',
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
                  "w-full h-full max-w-full max-h-full object-contain transition-opacity duration-300",
                  videoLoading ? "opacity-0" : "opacity-100"
                )}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
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
                      "w-full h-full max-w-full max-h-full object-contain transition-opacity duration-300",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
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
      <div className="px-4 py-3 space-y-3">
        {/* Prompt - Hide for tool-generated images (they use secret system prompts) */}
        {!isToolGenerated && (
          <div className="text-sm">
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
        )}

        {/* Tool Badge - Replaces tags */}
        {toolName && (item.tool?.slug || item.tool?.id) && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={item.tool?.slug ? `/${item.tool.slug}` : '#'}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                if (!item.tool?.slug) {
                  e.preventDefault();
                }
              }}
              className="inline-block"
            >
              <Badge 
                variant="default" 
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors"
              >
                {toolName}
              </Badge>
            </Link>
            {isVideo && (
              <Badge variant="secondary" className="text-xs">
                🎬 Video
              </Badge>
            )}
          </div>
        )}
        {!toolName && isVideo && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              🎬 Video
            </Badge>
          </div>
        )}

        {/* Bottom Row: Views, Likes, Share, Date - Multi-column layout */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
          <button 
            onClick={handleCardClick}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
            title={`${item.views} views`}
          >
            <Eye className="h-4 w-4" />
            <span className="font-medium">{item.views.toLocaleString()}</span>
          </button>
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors text-xs",
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart className={cn(
              "h-4 w-4",
              isLiked && "fill-current"
            )} />
            <span className="font-medium">{likesCount.toLocaleString()}</span>
          </button>
          <button 
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
            <span className="font-medium">Share</span>
          </button>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ✅ OPTIMIZED: Memoize component to prevent unnecessary re-renders in lists
// Only re-renders when props change (item, onLike, onView, priority, hideOwnerInfo, isLiked)
export const GalleryImageCard = memo(GalleryImageCardComponent);

