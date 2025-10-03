'use client';

import { useState } from 'react';
import { GalleryGrid } from '@/components/gallery-grid';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { items, loading, hasMore, loadMore, onLike, onView } = useGallery(page);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadMore();
  };

  const filteredItems = items.filter(item =>
    item.render.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      
      <div className="max-w-[2400px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Public Gallery
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore amazing AI-generated architectural renders created by our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search renders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
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
          onLike={onLike}
          onView={onView}
        />
      </div>
    </div>
  );
}
