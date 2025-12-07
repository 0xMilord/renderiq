'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Eye, 
  User, 
  Download, 
  Share2, 
  ArrowLeft,
  Calendar,
  Loader2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GalleryImageCard } from '@/components/gallery/gallery-image-card';
import { likeGalleryItem, viewGalleryItem, checkUserLiked } from '@/lib/actions/gallery.actions';
import { cn } from '@/lib/utils';
import type { GalleryItemWithDetails } from '@/lib/types';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

interface GalleryItemPageClientProps {
  item: GalleryItemWithDetails;
  similarItems: GalleryItemWithDetails[];
}

export function GalleryItemPageClient({ item, similarItems }: GalleryItemPageClientProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes);
  const [viewsCount, setViewsCount] = useState(item.views);
  const [copied, setCopied] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const viewRecordedRef = useRef(false);
  const likeStatusCheckedRef = useRef(false);

  useEffect(() => {
    // Record view only once per item (prevent duplicate calls from React Strict Mode or re-renders)
    if (!viewRecorded && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      viewGalleryItem(item.id).then(() => {
        setViewsCount(prev => prev + 1);
        setViewRecorded(true);
      }).catch(() => {
        // Silently fail - view increment is not critical
        viewRecordedRef.current = false; // Allow retry on error
      });
    }

    // Check if user has liked this item (only once per item)
    if (!likeStatusCheckedRef.current) {
      likeStatusCheckedRef.current = true;
      const fetchLikeStatus = async () => {
        try {
          const result = await checkUserLiked(item.id);
          if (result.success && result.data) {
            setIsLiked(result.data.liked);
          }
        } catch (error) {
          // Silently fail - like status check is not critical
          likeStatusCheckedRef.current = false; // Allow retry on error
        }
      };
      fetchLikeStatus();
    }

    // Reset loading states when item changes
    setImageLoading(true);
    setImageError(false);
    
    // Reset refs when item changes
    if (viewRecordedRef.current) {
      viewRecordedRef.current = false;
      setViewRecorded(false);
    }
    if (likeStatusCheckedRef.current) {
      likeStatusCheckedRef.current = false;
    }
    
    // Set default dimensions (16:9)
    setImageDimensions({ width: 1920, height: 1080 });

    // Timeout fallback - force hide loader after 15 seconds
    const timeoutId = setTimeout(() => {
      setImageLoading(false);
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [item.id]); // Only depend on item.id, not outputUrl (prevents unnecessary re-runs)

  const handleLike = async () => {
    const result = await likeGalleryItem(item.id);
    if (result.success && result.data) {
      setIsLiked(result.data.liked);
      setLikesCount(result.data.likes);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.render.prompt,
          text: `Check out this AI-generated architectural render: ${item.render.prompt}`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!item.render.outputUrl) return;
    
    try {
      const response = await fetch(item.render.outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renderiq-${item.id}.${item.render.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(item.render.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  // Check if prompt exceeds 10 lines
  const promptLines = item.render.prompt.split('\n').length;
  const shouldShowExpand = promptLines > 10;

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

  return (
    <article className="min-h-screen bg-background overflow-x-hidden" itemScope itemType="https://schema.org/Article">
      <div className="w-full max-w-full pt-[calc(var(--navbar-height)+1rem)] pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-full overflow-hidden">
          {/* Creator Header with Back Button and Action Buttons */}
          {item.user && (
            <header className="mb-6 flex items-center gap-3 flex-wrap" itemProp="author" itemScope itemType="https://schema.org/Person">
              {/* Back Button - Icon Only */}
              <Button
                variant="ghost"
                onClick={() => {
                  // Navigate back to gallery (preserving scroll position via sessionStorage)
                  router.push('/gallery');
                }}
                className="h-10 w-10 p-0"
                aria-label="Go back to gallery"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Link
                href={getUsernameUrl()}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                itemProp="url"
              >
                {item.user.avatar && !avatarError ? (
                  <div className="relative w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] overflow-hidden rounded-full">
                    <Image
                      src={item.user.avatar}
                      alt={`${item.user.name || 'User'}'s profile picture`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-full h-full"
                      style={{ maxWidth: '48px', maxHeight: '48px' }}
                      unoptimized={item.user.avatar.includes('dicebear.com')}
                      itemProp="image"
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 shrink-0 max-w-[48px] max-h-[48px] rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm" aria-hidden="true">
                    {getUserInitials()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg" itemProp="name">{item.user.name || 'Anonymous'}</p>
                  <time className="text-sm text-muted-foreground" dateTime={new Date(item.createdAt).toISOString()} itemProp="datePublished">
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              </Link>
              
              {/* Vertical Separator */}
              <div className="h-6 w-px bg-border"></div>
              
              {/* View Profile Button */}
              <Button
                variant="outline"
                onClick={() => router.push(getUsernameUrl())}
                className="flex items-center gap-1.5"
              >
                <User className="h-4 w-4" />
                View Profile
              </Button>
              
              {/* Action Buttons - Moved to Header */}
              <div className="flex flex-wrap items-center gap-3 ml-auto">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                  className="flex items-center gap-2"
                >
                  <Heart className={cn(
                    "h-4 w-4",
                    isLiked && "fill-current"
                  )} />
                  {likesCount}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!item.render.outputUrl}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{viewsCount}</span>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Separator */}
          <hr className="border-border mb-6" />

          {/* Main Content - 2 Column Layout: Image first on mobile/tablet, Prompt below. On desktop: Prompt (1/4) on Left, Image (3/4) on Right */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6 w-full max-w-full overflow-hidden">
            {/* Left Column - Prompt Box (1/4 width) - Shows below image on mobile/tablet */}
            <div className="w-full lg:w-1/4 lg:flex-shrink-0 min-w-0 max-w-full order-2 lg:order-1">
              <section className="bg-card rounded-lg border border-border p-4 lg:sticky lg:top-4 overflow-hidden flex flex-col max-h-[calc(25vh-2rem)] lg:max-h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="font-semibold text-lg">Prompt</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPrompt}
                    className="h-7"
                    aria-label="Copy prompt"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                  <p className={cn(
                    "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
                    !promptExpanded && "line-clamp-10"
                  )} itemProp="description">
                    {item.render.prompt}
                  </p>
                  {shouldShowExpand && (
                    <button
                      onClick={() => setPromptExpanded(!promptExpanded)}
                      className="text-sm text-primary hover:underline flex-shrink-0"
                      aria-expanded={promptExpanded}
                    >
                      {promptExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
                
                {/* Tags/Settings - Below Prompt */}
                {item.render.settings && (
                  <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {item.render.settings.style && (
                        <Badge variant="default" className="text-base px-3 py-1.5 h-auto">
                          {item.render.settings.style}
                        </Badge>
                      )}
                      {item.render.settings.quality && (
                        <Badge variant="default" className="text-base px-3 py-1.5 h-auto">
                          {item.render.settings.quality}
                        </Badge>
                      )}
                      {item.render.settings.aspectRatio && (
                        <Badge variant="default" className="text-base px-3 py-1.5 h-auto">
                          {item.render.settings.aspectRatio}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column - Image (3/4 width) - Shows first on mobile/tablet */}
            <div className="w-full lg:w-3/4 lg:flex-shrink-0 min-w-0 max-w-full overflow-hidden order-1 lg:order-2">
              {/* Main Image - With Before/After Slider if uploaded image exists */}
              <div className="relative rounded-2xl overflow-hidden bg-muted/50 w-full max-w-full" itemProp="image" itemScope itemType="https://schema.org/ImageObject">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {imageError ? (
                  <div className="w-full aspect-video flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-muted-foreground">Failed to load image</p>
                    </div>
                  </div>
                ) : item.render.uploadedImageUrl && item.render.outputUrl && imageDimensions ? (
                  // Before/After Comparison Slider
                  <>
                    <style dangerouslySetInnerHTML={{ __html: `
                      .gallery-item-slider-wrapper {
                        position: relative;
                        width: 100%;
                        max-width: 100%;
                        overflow: hidden;
                        box-sizing: border-box;
                      }
                      .gallery-item-slider-wrapper .react-before-after-slider-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 100% !important;
                        position: relative !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                      }
                      .gallery-item-slider-wrapper .react-before-after-slider-container img {
                        width: 100% !important;
                        max-width: 100% !important;
                        height: 100% !important;
                        object-fit: contain !important;
                        object-position: center !important;
                        box-sizing: border-box !important;
                      }
                    `}} />
                    <div 
                      className="relative w-full gallery-item-slider-wrapper" 
                      style={{ 
                        aspectRatio: imageDimensions.width / imageDimensions.height,
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <ReactBeforeSliderComponent
                          firstImage={{ imageUrl: item.render.outputUrl }}
                          secondImage={{ imageUrl: item.render.uploadedImageUrl }}
                          currentPercentPosition={75} // 75% shows more of the generated image
                        />
                      </div>
                      {/* Labels - Bottom corners: After on left (generated image), Before on right (uploaded image) */}
                      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border text-foreground px-3 py-1.5 rounded-md text-sm font-medium z-10">
                        After (Generated)
                      </div>
                      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border border-border text-foreground px-3 py-1.5 rounded-md text-sm font-medium z-10">
                        Before (Uploaded)
                      </div>
                    </div>
                  </>
                ) : item.render.outputUrl ? (
                  // Regular Image Display (no uploaded image)
                  <div className="relative w-full" style={{ aspectRatio: imageDimensions ? imageDimensions.width / imageDimensions.height : 16/9 }}>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!imageError ? (
                      // Use regular img tag for Supabase URLs to avoid Next.js 16 private IP blocking
                      item.render.outputUrl?.includes('supabase.co') ? (
                        <img
                          src={item.render.outputUrl}
                          alt={item.render.prompt || 'AI-generated architectural render'}
                          className={cn(
                            "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                            imageLoading ? "opacity-0" : "opacity-100"
                          )}
                          onLoad={() => {
                            setImageLoading(false);
                          }}
                          onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                          }}
                          itemProp="image"
                        />
                      ) : (
                        <Image
                          src={item.render.outputUrl}
                          alt={item.render.prompt || 'AI-generated architectural render'}
                          fill
                          className={cn(
                            "object-contain transition-opacity duration-300",
                            imageLoading ? "opacity-0" : "opacity-100"
                          )}
                          priority
                          sizes="(max-width: 1024px) 100vw, 80vw"
                          onLoad={() => {
                            setImageLoading(false);
                          }}
                          onLoadingComplete={() => {
                            setImageLoading(false);
                          }}
                          onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                          }}
                          itemProp="image"
                        />
                      )
                    ) : (
                      // Fallback to regular img tag if Next.js Image fails
                      <img
                        src={item.render.outputUrl}
                        alt={item.render.prompt || 'AI-generated architectural render'}
                        className="w-full h-full object-contain"
                        onLoad={() => {
                          setImageError(false);
                          setImageLoading(false);
                        }}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>


          {/* More like this - Full width */}
          {similarItems.length > 0 && (
            <section className="mt-12 w-full max-w-full overflow-hidden" aria-label="Similar gallery items">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">More like this</h2>
              <div className="h-[600px] overflow-y-auto pr-2 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full">
                  {similarItems.map((similarItem) => (
                    <GalleryImageCard
                      key={similarItem.id}
                      item={similarItem}
                      onLike={async (id) => {
                        const result = await likeGalleryItem(id);
                        return result;
                      }}
                      onView={async (id) => {
                        await viewGalleryItem(id);
                        router.push(`/gallery/${id}`);
                      }}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

