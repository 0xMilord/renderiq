'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPublicGallery, viewGalleryItem, likeGalleryItem, batchCheckUserLiked } from '@/lib/actions/gallery.actions';
import type { GalleryItemWithDetails } from '@/lib/types';

export function useGallery(
  limit = 20,
  options?: {
    sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'trending';
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
      const result = await getPublicGallery(pageNum, limit, options);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      
      if (result.success) {
        const newItems = result.data || [];
        
        // ✅ OPTIMIZED: Fetch liked status in parallel with gallery items
        // This prevents sequential waiting (10s -> 15s)
        const itemIds = newItems.length > 0 ? newItems.map(item => item.id) : [];
        const [likedResult] = await Promise.all([
          itemIds.length > 0 ? batchCheckUserLiked(itemIds) : Promise.resolve({ success: true, data: new Set<string>() }),
        ]);
        
        if (!mountedRef.current) return;
        
        // Update items
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(newItems.length === limit);
        setCurrentPage(pageNum);
        
        // Update liked items set
        if (likedResult.success && likedResult.data) {
          setLikedItems(prev => {
            const newSet = new Set(prev);
            likedResult.data.forEach(id => newSet.add(id));
            return newSet;
          });
        }
      } else {
        setError(result.error || 'Failed to fetch gallery items');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [limit, options]);

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
        // Optimistically update like count
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, likes: result.data!.likes, liked: result.data!.liked }
            : item
        ));
        
        // Update liked items set
        setLikedItems(prev => {
          const newSet = new Set(prev);
          if (result.data!.liked) {
            newSet.add(itemId);
          } else {
            newSet.delete(itemId);
          }
          return newSet;
        });
        
        return { success: true };
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
    options?.sortBy,
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
