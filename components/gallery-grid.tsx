'use client';

import { useState } from 'react';
import { RenderDisplay } from '@/components/render-display';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Eye } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';

interface GalleryGridProps {
  items: GalleryItemWithDetails[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  onView: (itemId: string) => void;
}

export function GalleryGrid({ 
  items, 
  loading, 
  hasMore, 
  onLoadMore, 
  onLike, 
  onView 
}: GalleryGridProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const handleLike = async (itemId: string) => {
    const result = await onLike(itemId);
    if (result.success) {
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No renders yet</h3>
        <p className="text-gray-600">Be the first to create an amazing AI render!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <RenderDisplay
              render={item.render}
              onLike={() => handleLike(item.id)}
              onView={() => onView(item.id)}
              showActions={true}
            />
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{item.likes}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{item.views}</span>
                </span>
              </div>
              <span className="text-xs">
                by {item.user.name || 'Anonymous'}
              </span>
            </div>
          </div>
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
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
