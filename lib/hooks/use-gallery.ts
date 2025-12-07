'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPublicGallery, viewGalleryItem, likeGalleryItem, batchCheckUserLiked } from '@/lib/actions/gallery.actions';
import type { GalleryItemWithDetails } from '@/lib/types';

export function useGallery(limit = 20) {
  const [items, setItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  // Use ref to prevent multiple simultaneous calls
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchItems = useCallback(async (pageNum = 1, append = false) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log('⚠️ Gallery fetch already in progress, skipping duplicate call');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      const result = await getPublicGallery(pageNum, limit);
      
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      
      if (result.success) {
        const newItems = result.data || [];
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(newItems.length === limit);
        setCurrentPage(pageNum);
        
        // Batch check liked status for all new items
        if (newItems.length > 0) {
          const itemIds = newItems.map(item => item.id);
          const likedResult = await batchCheckUserLiked(itemIds);
          if (likedResult.success && likedResult.data) {
            setLikedItems(prev => {
              const newSet = new Set(prev);
              likedResult.data.forEach(id => newSet.add(id));
              return newSet;
            });
          }
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
  }, [limit]);

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

  useEffect(() => {
    mountedRef.current = true;
    // Only fetch on initial mount
    fetchItems(1);
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchItems]);

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
