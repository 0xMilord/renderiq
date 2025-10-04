'use client';

import { useState, useEffect, useCallback } from 'react';
import { OptimisticRender } from './use-optimistic-generation';

export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedRenders, setCachedRenders] = useState<OptimisticRender[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached renders on mount
  useEffect(() => {
    const loadCachedRenders = () => {
      try {
        const cached = localStorage.getItem('cached-renders');
        if (cached) {
          const renders = JSON.parse(cached);
          setCachedRenders(renders);
        }
      } catch (error) {
        console.warn('Failed to load cached renders:', error);
      }
    };

    loadCachedRenders();
  }, []);

  // Cache a render
  const cacheRender = useCallback((render: OptimisticRender) => {
    try {
      const newCached = [render, ...cachedRenders].slice(0, 50); // Keep last 50
      setCachedRenders(newCached);
      localStorage.setItem('cached-renders', JSON.stringify(newCached));
    } catch (error) {
      console.warn('Failed to cache render:', error);
    }
  }, [cachedRenders]);

  // Remove cached render
  const removeCachedRender = useCallback((id: string) => {
    try {
      const newCached = cachedRenders.filter(render => render.id !== id);
      setCachedRenders(newCached);
      localStorage.setItem('cached-renders', JSON.stringify(newCached));
    } catch (error) {
      console.warn('Failed to remove cached render:', error);
    }
  }, [cachedRenders]);

  // Clear all cached renders
  const clearCache = useCallback(() => {
    try {
      setCachedRenders([]);
      localStorage.removeItem('cached-renders');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, []);

  return {
    isOnline,
    cachedRenders,
    cacheRender,
    removeCachedRender,
    clearCache,
  };
}
