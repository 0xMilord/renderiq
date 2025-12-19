'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MasonryFeed } from '@/components/gallery/masonry-feed';
import { type SortOption, type SortField, type SortDirection, type FilterOption } from '@/components/gallery/gallery-filters';
import { useGallery } from '@/lib/hooks/use-gallery';
import { Search, X, Filter, PanelLeftOpen, PanelLeftClose, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 shrink-0 overflow-hidden",
          "sticky top-[var(--navbar-height)] self-start",
          "h-[calc(100vh-var(--navbar-height))]",
          sidebarOpen 
            ? "w-[55%] sm:w-[275px]" 
            : "w-12"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "border-b shrink-0 flex items-center",
          sidebarOpen ? "px-4 h-16" : "px-0 h-16 justify-center"
        )}>
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full gap-4 min-w-0">
              <h2 className="text-lg font-semibold truncate flex-1 min-w-0">
                Filters
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          sidebarOpen ? "px-6 py-6 space-y-6" : "p-2 flex flex-col items-center gap-2"
        )}>
          {sidebarOpen ? (
            <>
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
            </>
          ) : (
            // Collapsed mode - icon buttons
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                title="Search"
                onClick={() => setSidebarOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                title="Filters"
                onClick={() => setSidebarOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <OptimizedBackground />
        </div>
        
        {/* Header with Title, Description, Sort */}
        <header className="sticky top-[var(--navbar-height)] z-40 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 h-16">
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center">
            {/* Main Header Row: Title/Description + Sort */}
            <div className="w-full flex items-center justify-between gap-4">
              {/* Title and Description */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                  Renderiq Gallery
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                  Explore amazing AI-generated architectural renders created by our community
                </p>
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

        {/* Content */}
        <section 
          ref={containerRef}
          className="w-full px-4 sm:px-4 lg:px-4 py-16 relative z-10" 
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
    </div>
  );
}
