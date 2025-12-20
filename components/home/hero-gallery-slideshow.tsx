'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VercelCard } from '@/components/ui/vercel-card';
import { DecoratedText } from '@/components/ui/decorated-text';
import type { GalleryItemWithDetails } from '@/lib/types';

interface HeroGallerySlideshowProps {
  items: GalleryItemWithDetails[];
  interval?: number; // milliseconds between slides
}

export function HeroGallerySlideshow({ items, interval = 4000 }: HeroGallerySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // ✅ OPTIMIZED: Memoize filtered items to avoid recalculating on every render
  const validItems = useMemo(() => {
    return items.filter(item => item.render.outputUrl && item.render.status === 'completed');
  }, [items]);

  useEffect(() => {
    if (validItems.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validItems.length);
    }, interval);

    return () => clearInterval(timer);
  }, [validItems.length, interval]);

  if (validItems.length === 0) {
    return (
      <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] bg-muted flex items-center justify-center rounded-lg">
        <p className="text-muted-foreground">No gallery images available</p>
      </div>
    );
  }

  const currentItem = validItems[currentIndex];
  const isVideo = currentItem.render.type === 'video';
  const imageUrl = currentItem.render.outputUrl!;
  const originalImageUrl = currentItem.render.uploadedImageUrl;
  const userName = currentItem.user?.name || 'Anonymous';
  const userAvatar = currentItem.user?.avatar;

  return (
    <VercelCard className="relative w-full h-full min-h-[400px] lg:min-h-[500px] overflow-visible group" showIcons={true} bordered={true}>
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Link href={`/gallery/${currentItem.id}`} className="block w-full h-full">
          {isVideo ? (
            <video
              key={`video-${currentItem.id}`}
              src={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-opacity duration-1000"
            />
          ) : (
            // Use regular img tag for external URLs (Supabase/GCS) to avoid Next.js 16 private IP blocking
            // and to work around hostname configuration issues
            imageUrl?.includes('supabase.co') || imageUrl?.includes('storage.googleapis.com') || imageUrl?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '') ? (
              <img
                key={`img-${currentItem.id}`}
                src={imageUrl}
                alt={currentItem.render.prompt || 'Architectural render'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <Image
                key={`next-img-${currentItem.id}`}
                src={imageUrl}
                alt={currentItem.render.prompt || 'Architectural render'}
                fill
                className="object-cover transition-opacity duration-1000"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                priority={currentIndex === 0}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
              />
            )
          )}
          
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Upper Left: Created by badge in VercelCard */}
          <div className="absolute top-4 left-4 z-20" key={`badge-${currentItem.id}`}>
            <VercelCard className="px-3 py-1.5 bg-background/90 backdrop-blur-sm" showIcons={false} bordered={true}>
              <DecoratedText className="text-xs md:text-sm font-medium text-foreground">
                Created by {userName}
              </DecoratedText>
            </VercelCard>
          </div>

          {/* Upper Right: Original image thumbnail in VercelCard */}
          {originalImageUrl && (
            <div className="absolute top-4 right-4 z-20" key={`thumbnail-${currentItem.id}`}>
              <VercelCard className="w-20 h-20 md:w-24 md:h-24 p-1 overflow-hidden" showIcons={false} bordered={true}>
                <div className="relative w-full h-full">
                  {originalImageUrl.includes('supabase.co') || originalImageUrl.includes('storage.googleapis.com') || originalImageUrl.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '') ? (
                    <img
                      key={`orig-img-${currentItem.id}`}
                      src={originalImageUrl}
                      alt="Original image"
                      className="w-full h-full object-cover rounded-md transition-opacity duration-1000"
                      loading="lazy"
                    />
                  ) : (
                    <Image
                      key={`orig-next-img-${currentItem.id}`}
                      src={originalImageUrl}
                      alt="Original image"
                      fill
                      className="object-cover rounded-md transition-opacity duration-1000"
                      sizes="96px"
                      loading="lazy"
                    />
                  )}
                </div>
              </VercelCard>
            </div>
          )}
          
          {/* Slide indicator dots */}
          {validItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {validItems.slice(0, Math.min(10, validItems.length)).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 bg-[hsl(72,87%,62%)]'
                      : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </Link>
      </div>
    </VercelCard>
  );
}

