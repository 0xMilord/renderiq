'use client';

import { useState, useEffect } from 'react';
import { getPublicGallery, viewGalleryItem, likeGalleryItem } from '@/lib/actions/gallery.actions';
import type { GalleryItemWithDetails } from '@/lib/types';

export function useGallery(page = 1, limit = 20) {
  const [items, setItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPublicGallery(pageNum, limit);
      
      if (result.success) {
        const newItems = result.data || [];
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setHasMore(newItems.length === limit);
      } else {
        setError(result.error || 'Failed to fetch gallery items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchItems(page + 1, true);
    }
  };

  const viewItem = async (itemId: string) => {
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
  };

  const likeItem = async (itemId: string) => {
    try {
      const result = await likeGalleryItem(itemId);
      if (result.success && result.data) {
        // Optimistically update like count
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, likes: result.data!.likes, liked: result.data!.liked }
            : item
        ));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchItems(page);
  }, [page]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    viewItem,
    likeItem,
    refetch: () => fetchItems(1),
  };
}
