'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Heart, Eye, ImageIcon } from 'lucide-react';
import { GalleryImageCard } from '@/components/gallery/gallery-image-card';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { likeGalleryItem, viewGalleryItem } from '@/lib/actions/gallery.actions';
import { useRouter } from 'next/navigation';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4">
        {/* User Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || 'User'}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background shadow-lg">
                  <User className="h-16 w-16 text-primary" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{user.name || 'Anonymous User'}</h1>
              <p className="text-muted-foreground mb-4">
                @{(user.name || 'user').toLowerCase().replace(/\s+/g, '')}{user.id.slice(-4)}
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{items.length}</span>
                  <span className="text-muted-foreground">Renders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {items.reduce((sum, item) => sum + item.likes, 0)}
                  </span>
                  <span className="text-muted-foreground">Total Likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {items.reduce((sum, item) => sum + item.views, 0)}
                  </span>
                  <span className="text-muted-foreground">Total Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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





