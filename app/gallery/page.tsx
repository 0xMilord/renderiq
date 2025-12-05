'use client';

import { useState, useMemo } from 'react';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { type SortOption, type FilterOption } from '@/components/gallery/gallery-filters';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, X, Filter, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { items, loading, hasMore, loadMore, likeItem, viewItem } = useGallery();

  const handleLoadMore = () => {
    loadMore();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleStyleToggle = (style: string) => {
    const currentStyles = filters.style || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    setFilters({ ...filters, style: newStyles });
  };

  const handleQualityToggle = (quality: string) => {
    const currentQualities = filters.quality || [];
    const newQualities = currentQualities.includes(quality)
      ? currentQualities.filter(q => q !== quality)
      : [...currentQualities, quality];
    setFilters({ ...filters, quality: newQualities });
  };

  const handleAspectRatioToggle = (aspectRatio: string) => {
    const currentRatios = filters.aspectRatio || [];
    const newRatios = currentRatios.includes(aspectRatio)
      ? currentRatios.filter(r => r !== aspectRatio)
      : [...currentRatios, aspectRatio];
    setFilters({ ...filters, aspectRatio: newRatios });
  };

  const handleContentTypeChange = (contentType: 'image' | 'video' | 'both') => {
    setFilters({ ...filters, contentType });
  };

  const activeFilterCount = 
    (filters.style?.length || 0) + 
    (filters.quality?.length || 0) + 
    (filters.aspectRatio?.length || 0) +
    (filters.contentType && filters.contentType !== 'both' ? 1 : 0);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Debug logging
    console.log('Gallery filtering:', {
      totalItems: items.length,
      searchQuery,
      filters,
      sortBy,
      initialResultCount: result.length
    });

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const beforeSearch = result.length;
      result = result.filter(item =>
        item.render.prompt.toLowerCase().includes(query) ||
        item.user.name?.toLowerCase().includes(query)
      );
      console.log('Search filter:', { beforeSearch, afterSearch: result.length, query });
    }

    // Style filter - case-insensitive, only filter if item has style setting
    if (filters.style && filters.style.length > 0) {
      result = result.filter(item => {
        const itemStyle = item.render.settings?.style;
        // If item doesn't have style setting, include it (don't filter out)
        if (!itemStyle) return true;
        // If item has style, check if it matches any filter
        return filters.style!.some(filterStyle => 
          String(itemStyle).toLowerCase() === String(filterStyle).toLowerCase()
        );
      });
    }

    // Quality filter - case-insensitive, only filter if item has quality setting
    if (filters.quality && filters.quality.length > 0) {
      result = result.filter(item => {
        const itemQuality = item.render.settings?.quality;
        // If item doesn't have quality setting, include it (don't filter out)
        if (!itemQuality) return true;
        // If item has quality, check if it matches any filter
        return filters.quality!.some(filterQuality => 
          String(itemQuality).toLowerCase() === String(filterQuality).toLowerCase()
        );
      });
    }

    // Aspect ratio filter - handle different formats (16:9 vs 16/9)
    if (filters.aspectRatio && filters.aspectRatio.length > 0) {
      result = result.filter(item => {
        const itemRatio = item.render.settings?.aspectRatio;
        // If item doesn't have aspect ratio setting, include it (don't filter out)
        if (!itemRatio) return true;
        // Normalize ratios (16:9, 16/9, etc.)
        const normalizeRatio = (ratio: string) => String(ratio).replace(/[:\/]/g, ':');
        const normalizedItemRatio = normalizeRatio(String(itemRatio));
        return filters.aspectRatio!.some(filterRatio => 
          normalizeRatio(String(filterRatio)) === normalizedItemRatio
        );
      });
    }

    // Content type filter (image/video/both)
    if (filters.contentType && filters.contentType !== 'both') {
      result = result.filter(item => {
        if (filters.contentType === 'image') {
          return item.render.type === 'image';
        } else if (filters.contentType === 'video') {
          return item.render.type === 'video';
        }
        return true;
      });
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

    console.log('Final filtered result:', { count: result.length, hasFilters: activeFilterCount > 0 });
    return result;
  }, [items, searchQuery, filters, sortBy, activeFilterCount]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header with Title, Description, Sidebar Button in Same Row */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border pointer-events-none">
        <div className="container mx-auto px-4 py-3 sm:py-4 pointer-events-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sidebar Toggle Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
                  <PanelLeftOpen className="h-4 w-4" />
                  <span className="sr-only">Toggle filters sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[300px] sm:w-[320px] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="h-full flex flex-col">
                  <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <SheetTitle>Filters</SheetTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <PanelLeftClose className="h-4 w-4" />
                      <span className="sr-only">Close sidebar</span>
                    </Button>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Search inside Sidebar */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search renders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                    </div>
                  {/* Sort */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="most_liked">Most Liked</SelectItem>
                        <SelectItem value="most_viewed">Most Viewed</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Content Type</Label>
                    <Select 
                      value={filters.contentType || 'both'} 
                      onValueChange={(value) => handleContentTypeChange(value as 'image' | 'video' | 'both')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="image">Images Only</SelectItem>
                        <SelectItem value="video">Videos Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Style Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Style</Label>
                    <div className="space-y-2">
                      {STYLE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`style-${option.value}`}
                            checked={filters.style?.includes(option.value) || false}
                            onCheckedChange={() => handleStyleToggle(option.value)}
                          />
                          <Label
                            htmlFor={`style-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quality Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quality</Label>
                    <div className="space-y-2">
                      {QUALITY_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`quality-${option.value}`}
                            checked={filters.quality?.includes(option.value) || false}
                            onCheckedChange={() => handleQualityToggle(option.value)}
                          />
                          <Label
                            htmlFor={`quality-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Aspect Ratio</Label>
                    <div className="space-y-2">
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ratio-${option.value}`}
                            checked={filters.aspectRatio?.includes(option.value) || false}
                            onCheckedChange={() => handleAspectRatioToggle(option.value)}
                          />
                          <Label
                            htmlFor={`ratio-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleClearFilters();
                      }}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters ({activeFilterCount})
                    </Button>
                  )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-0.5 sm:mb-1">
                Renderiq Gallery
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                Explore amazing AI-generated architectural renders created by our community
              </p>
            </div>
          </div>

          {/* Active Filter Badges Row */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.style?.map((style) => (
                <Badge
                  key={style}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => handleStyleToggle(style)}
                >
                  {STYLE_OPTIONS.find(o => o.value === style)?.label || style}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.quality?.map((quality) => (
                <Badge
                  key={quality}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => handleQualityToggle(quality)}
                >
                  {QUALITY_OPTIONS.find(o => o.value === quality)?.label || quality}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.aspectRatio?.map((ratio) => (
                <Badge
                  key={ratio}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => handleAspectRatioToggle(ratio)}
                >
                  {ASPECT_RATIO_OPTIONS.find(o => o.value === ratio)?.label || ratio}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.contentType && filters.contentType !== 'both' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => handleContentTypeChange('both')}
                >
                  {filters.contentType === 'image' ? 'Images Only' : 'Videos Only'}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-4 py-8 pt-[calc(1rem+2.75rem+1.5rem+4rem)]" aria-label="Gallery content">
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
