'use client';

import { useState, useMemo } from 'react';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { GalleryFilters, type SortOption, type FilterOption } from '@/components/gallery/gallery-filters';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { GalleryItemWithDetails } from '@/lib/types';

const STYLE_OPTIONS = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'architectural', label: 'Architectural' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'futuristic', label: 'Futuristic' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
  { value: 'ultra', label: 'Ultra' },
];

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
];

export default function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterOption>({});
  const { items, loading, hasMore, loadMore, likeItem, viewItem } = useGallery();

  const handleLoadMore = () => {
    loadMore();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.render.prompt.toLowerCase().includes(query) ||
        item.user.name?.toLowerCase().includes(query)
      );
    }

    // Style filter
    if (filters.style && filters.style.length > 0) {
      result = result.filter(item =>
        item.render.settings?.style && filters.style!.includes(item.render.settings.style)
      );
    }

    // Quality filter
    if (filters.quality && filters.quality.length > 0) {
      result = result.filter(item =>
        item.render.settings?.quality && filters.quality!.includes(item.render.settings.quality)
      );
    }

    // Aspect ratio filter
    if (filters.aspectRatio && filters.aspectRatio.length > 0) {
      result = result.filter(item =>
        item.render.settings?.aspectRatio && filters.aspectRatio!.includes(item.render.settings.aspectRatio)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_liked':
          return b.likes - a.likes;
        case 'most_viewed':
          return b.views - a.views;
        case 'trending':
          // Trending = combination of recent views and likes
          const aScore = a.likes * 2 + a.views + (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          const bScore = b.likes * 2 + b.views + (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, filters, sortBy]);

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-6">
          {/* Title and Description - Always visible */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Renderiq Gallery
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Explore amazing AI-generated architectural renders created by our community
            </p>
          </div>

          {/* Single Row: Search, Sort, Filters - 3 columns */}
          <div className="grid grid-cols-3 gap-4 items-center">

            {/* Search - Column 1 on mobile/tablet, Column 2 on desktop */}
            <div className="col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search renders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full h-11"
                />
              </div>
            </div>

            {/* Sort and Filters - Columns 2 & 3 on mobile/tablet, Columns 3 & 4 on desktop */}
            <GalleryFilters
              sortBy={sortBy}
              filters={filters}
              onSortChange={setSortBy}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Active Filter Badges Row - Below main row */}
          {Object.keys(filters).some(key => {
            const filterKey = key as keyof FilterOption;
            return filters[filterKey] && filters[filterKey]!.length > 0;
          }) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.style?.map((style) => (
                <Badge
                  key={style}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const currentStyles = filters.style || [];
                    const newStyles = currentStyles.includes(style)
                      ? currentStyles.filter(s => s !== style)
                      : [...currentStyles, style];
                    setFilters({ ...filters, style: newStyles });
                  }}
                >
                  {STYLE_OPTIONS.find(o => o.value === style)?.label || style}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.quality?.map((quality) => (
                <Badge
                  key={quality}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const currentQualities = filters.quality || [];
                    const newQualities = currentQualities.includes(quality)
                      ? currentQualities.filter(q => q !== quality)
                      : [...currentQualities, quality];
                    setFilters({ ...filters, quality: newQualities });
                  }}
                >
                  {QUALITY_OPTIONS.find(o => o.value === quality)?.label || quality}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.aspectRatio?.map((ratio) => (
                <Badge
                  key={ratio}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const currentRatios = filters.aspectRatio || [];
                    const newRatios = currentRatios.includes(ratio)
                      ? currentRatios.filter(r => r !== ratio)
                      : [...currentRatios, ratio];
                    setFilters({ ...filters, aspectRatio: newRatios });
                  }}
                >
                  {ASPECT_RATIO_OPTIONS.find(o => o.value === ratio)?.label || ratio}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-4 py-8" aria-label="Gallery content">
        {/* Masonry Feed */}
        <MasonryFeed
          items={filteredAndSortedItems}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLike={likeItem}
          onView={viewItem}
        />
      </section>
    </main>
  );
}
