'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { GalleryImageCard } from './gallery-image-card';
import { Pagination } from './pagination';
import { Loader2 } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';

interface MasonryFeedProps {
  items: GalleryItemWithDetails[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  onView: (itemId: string) => void;
  columns?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
  hideOwnerInfo?: boolean; // Hide user info when viewing owner's profile
}

export function MasonryFeed({
  items,
  loading,
  hasMore,
  onLoadMore,
  onLike,
  onView,
  columns = 4,
  currentPage,
  totalPages,
  onPageChange,
  showPagination = false,
  hideOwnerInfo = false
}: MasonryFeedProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Responsive column count: 1 on mobile, 2 on tablet, 3 on desktop
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1); // Mobile: 1 column
      } else if (width < 1024) {
        setColumnCount(2); // Tablet: 2 columns
      } else {
        setColumnCount(3); // Desktop: 3 columns
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute items across columns (masonry layout)
  const columnsData = useMemo(() => {
    const cols: GalleryItemWithDetails[][] = Array.from({ length: columnCount }, () => []);
    
    items.forEach((item, index) => {
      // Distribute evenly across columns
      const colIndex = index % columnCount;
      cols[colIndex].push(item);
    });
    
    return cols;
  }, [items, columnCount]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // Trigger load when sentinel is visible and we have more items
        if (target.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the bottom
        threshold: 0.1,
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-6xl mb-4">🖼️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No renders yet</h3>
        <p className="text-muted-foreground">Be the first to create an amazing AI render!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Masonry Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`
        }}
      >
        {columnsData.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4">
            {column.map((item, itemIndex) => (
              <GalleryImageCard
                key={item.id}
                item={item}
                onLike={onLike}
                onView={onView}
                priority={colIndex === 0 && itemIndex < 3}
                hideOwnerInfo={hideOwnerInfo}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && currentPage && totalPages && onPageChange && (
        <div className="flex justify-center pt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Infinite Scroll Sentinel & Loading Indicator */}
      {!showPagination && (
        <>
          {/* Sentinel element for intersection observer */}
          <div ref={observerTarget} className="h-20 w-full" />
          
          {/* Loading indicator */}
          {loading && hasMore && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            </div>
          )}
          
          {/* End of feed message */}
          {!hasMore && items.length > 0 && (
            <div className="flex justify-center py-8">
              <p className="text-sm text-muted-foreground">You've reached the end</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

