'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import type { User } from '@supabase/supabase-js';

/**
 * Helper function to get user from server action
 * Prioritizes userId from client (passed from Zustand store) to avoid DB calls
 * Falls back to cached auth if userId not provided
 * 
 * @param userIdFromClient - Optional userId passed from client store
 * @returns User object or null, userId, and whether it came from cache
 */
export async function getUserFromAction(
  userIdFromClient?: string | null
): Promise<{ user: User | null; userId: string | null; fromCache: boolean }> {
  // If userId is provided from client, validate it with cached auth
  if (userIdFromClient) {
    const { user, fromCache } = await getCachedUser();
    
    // Verify the userId matches the cached user
    if (user && user.id === userIdFromClient) {
      return { user, userId: userIdFromClient, fromCache };
    }
    
    // If userId doesn't match, return null (shouldn't happen in normal flow)
    return { user: null, userId: null, fromCache: false };
  }
  
  // No userId from client, use cached auth
  const { user, fromCache } = await getCachedUser();
  return { user, userId: user?.id || null, fromCache };
}

