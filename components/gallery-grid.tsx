'use client';

import { useState } from 'react';
import { CommonImageCard } from '@/components/common/image-card';
import { ImageModal } from '@/components/common/image-modal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';

interface GalleryGridProps {
  items: GalleryItemWithDetails[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  onView: (itemId: string) => void;
  onRemix?: (prompt: string) => void;
}

export function GalleryGrid({ 
  items, 
  loading, 
  hasMore, 
  onLoadMore, 
  onLike, 
  onView,
  onRemix
}: GalleryGridProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItemWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLike = async (item: GalleryItemWithDetails) => {
    await onLike(item.id);
  };

  const handleView = (item: GalleryItemWithDetails) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    onView(item.id);
  };

  const handleRemix = (prompt: string) => {
    if (onRemix) {
      onRemix(prompt);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No renders yet</h3>
        <p className="text-muted-foreground">Be the first to create an amazing AI render!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <CommonImageCard
              key={item.id}
              galleryItem={item}
              onView={handleView}
              onLike={handleLike}
              onRemix={onRemix ? () => handleRemix(item.render.prompt) : undefined}
              showUser={true}
              showStats={true}
              showActions={true}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </Button>
          </div>
        )}
      </div>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onLike={handleLike}
        onRemix={onRemix ? handleRemix : undefined}
      />
    </>
  );
}
