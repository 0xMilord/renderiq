'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Marquee } from '@/components/ui/marquee';
import { VercelCard } from '@/components/ui/vercel-card';
import type { GalleryItemWithDetails } from '@/lib/types';

interface PinterestGalleryProps {
  items: GalleryItemWithDetails[];
}

const PinterestGallery = memo(function PinterestGallery({ items }: PinterestGalleryProps) {
  // Filter items that have output URLs (images/videos)
  const validItems = useMemo(() => {
    return items.filter(item => item.render.outputUrl && item.render.status === 'completed');
  }, [items]);

  // Split items into 3 columns for Pinterest-style layout
  const columns = useMemo(() => {
    const col1: GalleryItemWithDetails[] = [];
    const col2: GalleryItemWithDetails[] = [];
    const col3: GalleryItemWithDetails[] = [];

    validItems.forEach((item, index) => {
      if (index % 3 === 0) {
        col1.push(item);
      } else if (index % 3 === 1) {
        col2.push(item);
      } else {
        col3.push(item);
      }
    });

    return [col1, col2, col3];
  }, [validItems]);

  // Render a single gallery item
  const renderItem = (item: GalleryItemWithDetails) => {
    const imageUrl = item.render.outputUrl!;
    const aspectRatio = item.render.settings?.aspectRatio || '16:9';
    
    // Calculate aspect ratio for proper sizing
    let aspectRatioClass = 'aspect-video'; // default 16:9
    if (aspectRatio === '4:3') aspectRatioClass = 'aspect-[4/3]';
    else if (aspectRatio === '1:1') aspectRatioClass = 'aspect-square';
    else if (aspectRatio === '21:9') aspectRatioClass = 'aspect-[21/9]';

    return (
      <Link
        key={item.id}
        href={`/gallery/${item.id}`}
        className="block mb-2 group cursor-pointer"
      >
        <VercelCard className="w-full bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2]" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
          <div className={`relative w-full ${aspectRatioClass} overflow-hidden rounded-none`}>
            {item.render.type === 'image' ? (
              // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
              (imageUrl?.includes('supabase.co') || imageUrl?.includes('storage.googleapis.com') || imageUrl?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '')) ? (
                <img
                  src={imageUrl}
                  alt={item.render.prompt || 'Architectural render'}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={item.render.prompt || 'Architectural render'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              )
            ) : (
              <video
                src={imageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>
        </VercelCard>
      </Link>
    );
  };

  // If no items, show placeholder
  if (validItems.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <VercelCard key={i} className="bg-[hsl(72,87%,62%)] overflow-visible border-2 border-black/[0.2] dark:border-black/[0.2] aspect-video relative" showIcons={true} bordered={true} iconClassName="text-black dark:text-black">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-muted-foreground font-medium">Sample Render {i}</p>
              </div>
            </div>
          </VercelCard>
        ))}
      </div>
    );
  }

  // Ensure minimum repeat count for smooth animation (even with few items)
  const getRepeatCount = (columnLength: number) => {
    if (columnLength === 0) return 1;
    // For smooth continuous animation, repeat at least 3-4 times
    // If we have few items, repeat more to fill the space
    return columnLength < 3 ? 6 : 4;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full overflow-hidden">
      {/* Column 1: Bottom to Top (Reverse) */}
      <div className="relative h-full overflow-hidden">
        <Marquee
          vertical
          reverse
          repeat={getRepeatCount(columns[0].length)}
          className="h-full [--duration:50s] [--gap:0.5rem]"
          pauseOnHover
        >
          {columns[0].map((item) => renderItem(item))}
        </Marquee>
      </div>

      {/* Column 2: Top to Bottom */}
      <div className="relative h-full overflow-hidden">
        <Marquee
          vertical
          repeat={getRepeatCount(columns[1].length)}
          className="h-full [--duration:60s] [--gap:0.5rem]"
          pauseOnHover
        >
          {columns[1].map((item) => renderItem(item))}
        </Marquee>
      </div>

      {/* Column 3: Bottom to Top (Reverse) */}
      <div className="relative h-full overflow-hidden">
        <Marquee
          vertical
          reverse
          repeat={getRepeatCount(columns[2].length)}
          className="h-full [--duration:55s] [--gap:0.5rem]"
          pauseOnHover
        >
          {columns[2].map((item) => renderItem(item))}
        </Marquee>
      </div>
    </div>
  );
});

PinterestGallery.displayName = 'PinterestGallery';

export { PinterestGallery };

