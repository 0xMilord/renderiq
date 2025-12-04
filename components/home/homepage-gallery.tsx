'use client';

import { useRouter } from 'next/navigation';
import { GalleryImageCard } from '@/components/gallery/gallery-image-card';
import { likeGalleryItem } from '@/lib/actions/gallery.actions';
import type { GalleryItemWithDetails } from '@/lib/types';

interface HomepageGalleryProps {
  items: GalleryItemWithDetails[];
}

export function HomepageGallery({ items }: HomepageGalleryProps) {
  const router = useRouter();

  const handleLike = async (itemId: string) => {
    return await likeGalleryItem(itemId);
  };

  const handleView = (itemId: string) => {
    // View tracking is handled by the GalleryImageCard component
  };

  if (items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg bg-card border border-border aspect-square hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-muted-foreground font-medium">Sample Render {i}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {items.map((item, index) => (
        <GalleryImageCard
          key={item.id}
          item={item}
          onLike={handleLike}
          onView={handleView}
          priority={index < 3} // Prioritize first 3 images for LCP
        />
      ))}
    </div>
  );
}

