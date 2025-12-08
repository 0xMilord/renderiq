'use server';

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

interface CachedAuth {
  user: User | null;
  timestamp: number;
  sessionId?: string;
}

// In-memory cache with TTL (Time To Live)
// Key: session token hash or user ID
// Value: Cached auth data
const authCache = new Map<string, CachedAuth>();

// Cache TTL: 5 minutes (300000ms)
const CACHE_TTL = 5 * 60 * 1000;

// Cleanup interval: Remove expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of authCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        authCache.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Get user from cache or DB
 * This function caches the user session to prevent DB hammering
 */
export async function getCachedUser(): Promise<{ user: User | null; fromCache: boolean }> {
  try {
    const supabase = await createClient();
    
    // ✅ SECURITY: Use getUser() instead of getSession() to authenticate with Supabase Auth server
    // This ensures the user data is authentic and not just from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { user: null, fromCache: false };
    }

    const userId = user.id;
    
    // Create cache key from user ID
    const cacheKey = `user:${userId}`;
    
    // Check cache
    const cached = authCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      // Cache hit - return cached user
      logger.log('✅ AuthCache: Cache hit for user:', userId);
      return { user: cached.user, fromCache: true };
    }
    
    // Cache miss or expired - update cache with authenticated user
    logger.log('🔄 AuthCache: Cache miss, updating cache for user:', userId);
    
    // Update cache
    authCache.set(cacheKey, {
      user,
      timestamp: now,
    });
    
    return { user, fromCache: false };
  } catch (error) {
    logger.error('❌ AuthCache: Error getting cached user:', error);
    return { user: null, fromCache: false };
  }
}

/**
 * Invalidate cache for a specific user
 * Call this when user data changes (e.g., profile update, logout)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const cacheKey = `user:${userId}`;
  authCache.delete(cacheKey);
  logger.log('🗑️ AuthCache: Invalidated cache for user:', userId);
}

/**
 * Clear all auth cache
 * Useful for testing or when auth state changes globally
 */
export async function clearAuthCache(): Promise<void> {
  authCache.clear();
  logger.log('🗑️ AuthCache: Cleared all auth cache');
}


