'use client';

import { useState, useEffect } from 'react';
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
  Check
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

  useEffect(() => {
    // Record view
    viewGalleryItem(item.id).then(() => {
      setViewsCount(prev => prev + 1);
    });

    // Check if user has liked this item
    const fetchLikeStatus = async () => {
      const result = await checkUserLiked(item.id);
      if (result.success && result.data) {
        setIsLiked(result.data.liked);
      }
    };
    fetchLikeStatus();

    // Load image dimensions
    if (item.render.outputUrl) {
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
      img.src = item.render.outputUrl;
    }
  }, [item.id, item.render.outputUrl]);

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
    const name = item.user.name || item.user.email || 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <article className="min-h-screen bg-background" itemScope itemType="https://schema.org/Article">
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <nav aria-label="Breadcrumb">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
            aria-label="Go back to gallery"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </nav>

        <div className="max-w-5xl mx-auto">
          {/* Creator Header */}
          {item.user && (
            <header className="mb-6" itemProp="author" itemScope itemType="https://schema.org/Person">
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
            </header>
          )}

          {/* Separator */}
          <hr className="border-border mb-6" />

          {/* Main Image - With Before/After Slider if uploaded image exists */}
          <div className="relative rounded-2xl overflow-hidden bg-muted/50 mb-6" itemProp="image" itemScope itemType="https://schema.org/ImageObject">
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
              <div className="relative w-full" style={{ aspectRatio: imageDimensions.width / imageDimensions.height }}>
                <ReactBeforeSliderComponent
                  firstImage={{ imageUrl: item.render.uploadedImageUrl }}
                  secondImage={{ imageUrl: item.render.outputUrl }}
                  currentPercentPosition={75} // 75% shows more of the generated image
                  sliderLineWidth={4}
                  sliderLineColor="hsl(var(--primary))"
                />
                {/* Labels - Bottom corners */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-sm font-medium z-10">
                  Before (Uploaded)
                </div>
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-md text-sm font-medium z-10">
                  After (Generated)
                </div>
              </div>
            ) : item.render.outputUrl && imageDimensions ? (
              // Regular Image Display (no uploaded image)
              <div className="relative w-full" style={{ aspectRatio: imageDimensions.width / imageDimensions.height }}>
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
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  itemProp="image"
                />
              </div>
            ) : null}
          </div>

          {/* Action Buttons - Below Image */}
          <div className="flex flex-wrap gap-3 mb-6">
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
            <div className="flex items-center gap-4 ml-auto text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{viewsCount}</span>
              </div>
            </div>
          </div>

          {/* Prompt Section */}
          <section className="space-y-3 mb-8">
            <div className="flex items-center justify-between">
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
            <div className="space-y-2">
              <p className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !promptExpanded && "line-clamp-10"
              )} itemProp="description">
                {item.render.prompt}
              </p>
              {shouldShowExpand && (
                <button
                  onClick={() => setPromptExpanded(!promptExpanded)}
                  className="text-sm text-primary hover:underline"
                  aria-expanded={promptExpanded}
                >
                  {promptExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </section>

          {/* Settings */}
          {item.render.settings && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {item.render.settings.style && (
                  <Badge variant="secondary">
                    {item.render.settings.style}
                  </Badge>
                )}
                {item.render.settings.quality && (
                  <Badge variant="secondary">
                    {item.render.settings.quality}
                  </Badge>
                )}
                {item.render.settings.aspectRatio && (
                  <Badge variant="secondary">
                    {item.render.settings.aspectRatio}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* More like this - Fixed height scroll container */}
          {similarItems.length > 0 && (
            <section className="mt-12" aria-label="Similar gallery items">
              <h2 className="text-2xl font-bold mb-6">More like this</h2>
              <div className="h-[600px] overflow-y-auto pr-2">
                <div className="grid grid-cols-3 gap-4">
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

