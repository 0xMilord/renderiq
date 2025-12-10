'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { GalleryImageCard } from '@/components/gallery/gallery-image-card';
import { likeGalleryItem, viewGalleryItem, getUserLikedItems } from '@/lib/actions/gallery.actions';
import { Heart, Loader2 } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function LikesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [likedItems, setLikedItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Hooks must be called before any early returns
  // Memoize like handler to prevent unnecessary re-renders
  const handleLike = useCallback(async (id: string) => {
    const result = await likeGalleryItem(id);
    if (result.success && result.data && !result.data.liked) {
      // Remove from list if unliked
      setLikedItems(prev => prev.filter(i => i.id !== id));
    }
    return result;
  }, []);

  // Memoize view handler
  const handleView = useCallback(async (id: string) => {
    await viewGalleryItem(id);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // ✅ MIGRATED: Use server action instead of API route
      const fetchLikedItems = async () => {
        try {
          const result = await getUserLikedItems(100, 0);
          if (result.success && result.data) {
            setLikedItems(result.data);
          }
        } catch (error) {
          console.error('Error fetching liked items:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchLikedItems();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Gallery Grid */}
        {likedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {likedItems.map((item) => (
              <GalleryImageCard
                key={item.id}
                item={item}
                onLike={handleLike}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
              No liked images yet
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mb-6">
              Start exploring the gallery and like images you want to save
            </p>
            <Button asChild>
              <a href="/gallery">Explore Gallery</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

