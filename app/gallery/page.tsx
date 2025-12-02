'use client';

import { useState } from 'react';
import { GalleryGrid } from '@/components/gallery-grid';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/utils/logger';

export default function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { items, loading, hasMore, loadMore, likeItem, viewItem } = useGallery();

  const handleLoadMore = () => {
    loadMore();
  };

  const filteredItems = items.filter(item =>
    item.render.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Public Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Explore amazing AI-generated architectural renders created by our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search renders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full h-11"
              />
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters coming soon</span>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <GalleryGrid
          items={filteredItems}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLike={likeItem}
          onView={viewItem}
          onRemix={(prompt) => {
            // Navigate to the appropriate engine with the prompt
            // This would need to be implemented based on your routing
            logger.log('Remix with prompt:', prompt);
          }}
        />
      </div>
    </div>
  );
}
