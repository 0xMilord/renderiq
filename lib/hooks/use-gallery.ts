'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPublicGallery, viewGalleryItem, likeGalleryItem, batchCheckUserLiked } from '@/lib/actions/gallery.actions';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { SortOption } from '@/components/gallery/gallery-filters';

export function useGallery(
  limit = 20,
  options?: {
    sortBy?: SortOption;
    filters?: {
      style?: string[];
      quality?: string[];
      aspectRatio?: string[];
      contentType?: 'image' | 'video' | 'both';
    };
    searchQuery?: string;
  }
) {
  const [items, setItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // Use ref to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // ✅ FIXED: Memoize options to prevent unnecessary callback recreation
  const memoizedOptions = useMemo(() => options, [
    options?.sortBy?.field,
    options?.sortBy?.direction,
    options?.searchQuery,
    options?.filters?.style?.join(',') || '',
    options?.filters?.quality?.join(',') || '',
    options?.filters?.aspectRatio?.join(',') || '',
    options?.filters?.contentType || '',
  ]);

  // ✅ OPTIMIZED: Parallelize gallery fetch + liked status check
  const fetchItems = useCallback(async (pageNum = 1, append = false) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      // ✅ OPTIMIZED: Fetch gallery items with server-side filtering/sorting
      // This prevents fetching ALL items and filtering client-side (major performance win)
      const result = await getPublicGallery(pageNum, limit, memoizedOptions);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      
      if (result.success) {
        const newItems = result.data || [];
        
        // ✅ OPTIMIZED: Batch fetch liked status in parallel (non-blocking)
        // Only fetch if we have items to avoid unnecessary queries
        const itemIds = newItems.length > 0 ? newItems.map(item => item.id) : [];
        
        // ✅ OPTIMIZED: Don't await liked check - let it run in background
        // This prevents blocking the UI update while still updating liked status
        if (itemIds.length > 0) {
          batchCheckUserLiked(itemIds).then((likedResult) => {
            if (!mountedRef.current) return;
            if (likedResult.success && likedResult.data) {
              setLikedItems(prev => {
                const newSet = new Set(prev);
                likedResult.data.forEach(id => newSet.add(id));
                return newSet;
              });
            }
          }).catch(() => {
            // Silently fail - liked status is not critical for page functionality
          });
        }
        
        if (!mountedRef.current) return;
        
        // Update items immediately (don't wait for liked status)
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(newItems.length === limit);
        setCurrentPage(pageNum);
      } else {
        console.error('❌ [useGallery] Error:', result.error);
        setError(result.error || 'Failed to fetch gallery items');
      }
    } catch (err) {
      console.error('❌ [useGallery] Exception:', err);
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [limit, memoizedOptions]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !fetchingRef.current) {
      fetchItems(currentPage + 1, true);
    }
  }, [loading, hasMore, currentPage, fetchItems]);

  const viewItem = useCallback(async (itemId: string) => {
    try {
      await viewGalleryItem(itemId);
      // Optimistically update view count
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, views: item.views + 1 }
          : item
      ));
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  }, []);

  const likeItem = useCallback(async (itemId: string) => {
    try {
      const result = await likeGalleryItem(itemId);
      if (result.success && result.data) {
        // ✅ FIXED: Update items array with server response (ensures consistency)
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, likes: result.data!.likes }
            : item
        ));
        
        // ✅ FIXED: Update liked items set (single source of truth)
        setLikedItems(prev => {
          const newSet = new Set(prev);
          if (result.data!.liked) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });
        
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { success: false, error: errorMessage };
    }
  }, []);

  const refetch = useCallback(() => {
    fetchItems(1);
  }, [fetchItems]);

  // ✅ FIXED: Store latest fetchItems in ref to avoid dependency issues
  const fetchItemsRef = useRef(fetchItems);
  useEffect(() => {
    fetchItemsRef.current = fetchItems;
  }, [fetchItems]);
  
  // ✅ FIXED: Memoize options key to prevent infinite loops
  // This creates a stable string representation that only changes when options actually change
  const optionsKey = useMemo(() => {
    return JSON.stringify({
      sortBy: options?.sortBy,
      searchQuery: options?.searchQuery,
      filters: options?.filters || {},
    });
  }, [
    options?.sortBy?.field,
    options?.sortBy?.direction,
    options?.searchQuery,
    options?.filters?.style?.join(',') || '',
    options?.filters?.quality?.join(',') || '',
    options?.filters?.aspectRatio?.join(',') || '',
    options?.filters?.contentType || '',
  ]);
  
  const prevOptionsKeyRef = useRef<string>('');
  const isInitialMountRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // ✅ FIXED: Only refetch if options actually changed (prevents infinite loop)
    // On initial mount, always fetch
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevOptionsKeyRef.current = optionsKey;
      fetchItemsRef.current(1, false);
    } else if (prevOptionsKeyRef.current !== optionsKey) {
      // Options changed, reset and refetch
      prevOptionsKeyRef.current = optionsKey;
      setCurrentPage(1);
      setItems([]);
      fetchItemsRef.current(1, false);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [optionsKey]); // ✅ FIXED: Only depend on optionsKey, not fetchItems

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    viewItem,
    likeItem,
    refetch,
    likedItems, // Expose liked items set for components to use
  };
}
