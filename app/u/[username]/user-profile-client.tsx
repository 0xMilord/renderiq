'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { User, Heart, Eye, ImageIcon, AtSign } from 'lucide-react';
import { GalleryImageCard } from '@/components/gallery/gallery-image-card';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { likeGalleryItem, viewGalleryItem } from '@/lib/actions/gallery.actions';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import type { GalleryItemWithDetails } from '@/lib/types';

interface UserProfilePageClientProps {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  galleryItems: GalleryItemWithDetails[];
}

export function UserProfilePageClient({ user, galleryItems }: UserProfilePageClientProps) {
  const router = useRouter();
  const [items] = useState(galleryItems);

  const handleLike = async (itemId: string) => {
    const result = await likeGalleryItem(itemId);
    return result;
  };

  const handleView = (itemId: string) => {
    router.push(`/gallery/${itemId}`);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalLikes = items.reduce((sum, item) => sum + item.likes, 0);
    const totalViews = items.reduce((sum, item) => sum + item.views, 0);
    return { totalLikes, totalViews };
  }, [items]);

  // Format username for display
  const displayName = user.name || 'Anonymous User';
  const usernameSlug = useMemo(() => {
    if (!user.name) return 'user';
    return user.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, [user.name]);

  return (
    <div className="min-h-screen bg-background">
      {/* Add top padding to prevent navbar clipping */}
      <div className="container mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        {/* User Header Card */}
        <Card className="mb-12 border-2 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user.avatar ? (
                  <div className="relative">
                    <Image
                      src={user.avatar}
                      alt={displayName}
                      width={140}
                      height={140}
                      className="rounded-full border-4 border-primary/20 shadow-xl object-cover"
                    />
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                  </div>
                ) : (
                  <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/20 shadow-xl">
                    <User className="h-20 w-20 text-primary" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left min-w-0">
                {/* Username Display */}
                <div className="mb-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {displayName}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <AtSign className="h-4 w-4" />
                    <span className="text-base sm:text-lg font-medium">{usernameSlug}</span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 sm:gap-6 justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{items.length}</span>
                      <span className="text-xs text-muted-foreground">Renders</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{stats.totalLikes}</span>
                      <span className="text-xs text-muted-foreground">Likes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{stats.totalViews}</span>
                      <span className="text-xs text-muted-foreground">Views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        {items.length > 0 ? (
          <MasonryFeed
            items={items}
            loading={false}
            hasMore={false}
            onLoadMore={() => {}}
            onLike={handleLike}
            onView={handleView}
            columns={3}
            hideOwnerInfo={true}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-6xl mb-4">🖼️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No renders yet</h3>
            <p className="text-muted-foreground">This user hasn't shared any renders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}










