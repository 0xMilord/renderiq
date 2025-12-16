'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { type SortOption, type SortField, type SortDirection, type FilterOption } from '@/components/gallery/gallery-filters';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, X, Filter, PanelLeftOpen, PanelLeftClose, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import OptimizedBackground from '@/components/home/optimized-background';

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
  const [sortBy, setSortBy] = useState<SortOption>({ field: 'date', direction: 'desc' });
  const [filters, setFilters] = useState<FilterOption>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ✅ FIXED: Memoize options object to prevent infinite loop
  // This prevents the options object from being recreated on every render
  const galleryOptions = useMemo(() => ({
    sortBy,
    filters,
    searchQuery,
  }), [sortBy.field, sortBy.direction, filters, searchQuery]);
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortBy(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Handle sort field change
  const handleSortFieldChange = (field: SortField) => {
    setSortBy(prev => ({
      field,
      direction: prev.direction // Keep current direction
    }));
  };
  
  // Get sort display label
  const getSortLabel = (field: SortField): string => {
    const labels: Record<SortField, string> = {
      date: 'Date Created',
      likes: 'Likes',
      views: 'Views',
      trending: 'Trending Score'
    };
    return labels[field];
  };
  
  // ✅ OPTIMIZED: Pass filters and sort to hook for server-side processing
  const { items, loading, hasMore, loadMore, likeItem, viewItem, likedItems } = useGallery(20, galleryOptions);
  const scrollRestoredRef = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // Restore scroll position when returning from gallery item page
  useEffect(() => {
    // Only restore once on mount
    if (scrollRestoredRef.current) return;

    const savedScrollPosition = sessionStorage.getItem('gallery-scroll-position');
    if (savedScrollPosition && !loading) {
      const scrollY = parseInt(savedScrollPosition, 10);
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollY,
          behavior: 'instant' as ScrollBehavior, // Instant to avoid animation
        });
        scrollRestoredRef.current = true;
        // Clear the saved position after restoring
        sessionStorage.removeItem('gallery-scroll-position');
      });
    } else if (!loading) {
      scrollRestoredRef.current = true;
    }
  }, [loading]);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only save if we're on the gallery page (not navigating to a gallery item)
      if (window.location.pathname === '/gallery') {
        sessionStorage.setItem('gallery-scroll-position', window.scrollY.toString());
      }
    };

    // Save scroll position periodically while scrolling
    const handleScroll = () => {
      if (window.location.pathname === '/gallery') {
        sessionStorage.setItem('gallery-scroll-position', window.scrollY.toString());
      }
    };

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(scrollTimeout);
    };
  }, []);

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

  // ✅ OPTIMIZED: No client-side filtering/sorting needed - all done server-side
  // Items are already filtered and sorted from the server
  const filteredAndSortedItems = items;

  return (
    <main className="min-h-screen bg-background relative">
      {/* Grid Background */}
      <OptimizedBackground />
      
      {/* Header with Title, Description, Sidebar Button in Same Row */}
      <header className="fixed top-[var(--navbar-height)] left-0 right-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Main Header Row: Sidebar Button + Title/Description + Sort */}
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
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

            {/* Sort - On extreme right */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Select value={sortBy.field} onValueChange={(value) => handleSortFieldChange(value as SortField)}>
                <SelectTrigger className="w-[140px] sm:w-[180px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Created</SelectItem>
                  <SelectItem value="likes">Likes</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="trending">Trending Score</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleSortDirection}
                disabled={sortBy.field === 'trending'}
                title={
                  sortBy.field === 'trending' 
                    ? 'Trending always sorts by highest score' 
                    : `Sort ${sortBy.direction === 'asc' ? 'Ascending' : 'Descending'} - Click to toggle`
                }
              >
                {sortBy.direction === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Active Filter Badges Row - Separate from main header row */}
          {activeFilterCount > 0 && (
            <div className="pb-3 pt-2 border-t border-border flex flex-wrap gap-2">
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

      {/* End-to-end separator below header - Dynamic height based on filter badges */}
      <div 
        className="fixed left-0 right-0 z-40 h-px bg-border" 
        style={{ 
          top: activeFilterCount > 0 
            ? 'calc(var(--navbar-height) + 3.5rem + 3rem)' // h-14 (3.5rem) + filter badges row (~3rem)
            : 'calc(var(--navbar-height) + 3.5rem)' // Just h-14 (3.5rem)
        }}
      />

      {/* Content - Dynamic padding based on filter badges */}
      <section 
        ref={containerRef}
        className="w-full px-4 sm:px-6 lg:px-8 py-8" 
        style={{
          paddingTop: activeFilterCount > 0
            ? 'calc(var(--navbar-height) + 3.5rem + 3rem + 1.5rem)' // Header + filter badges + spacing
            : 'calc(var(--navbar-height) + 3.5rem + 1.5rem)' // Just header + spacing
        }}
        aria-label="Gallery content"
      >
        {/* Masonry Feed */}
        <MasonryFeed
          items={items}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLike={likeItem}
          onView={viewItem}
          likedItems={likedItems}
        />
      </section>
    </main>
  );
}
