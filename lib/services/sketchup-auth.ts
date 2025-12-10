'use server';

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

/**
 * Get user from Bearer token for SketchUp extension
 * This bypasses cookie-based auth and uses the token directly
 */
export async function getUserFromBearerToken(token: string): Promise<{ user: User | null; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      logger.warn('❌ SketchUp Auth: Invalid token', { error: userError?.message });
      return { user: null, error: userError?.message || 'Invalid token' };
    }

    logger.log('✅ SketchUp Auth: User authenticated', {
      userId: user.id,
      email: user.email,
    });

    return { user };
  } catch (error) {
    logger.error('❌ SketchUp Auth: Error getting user from token:', error);
    return { user: null, error: 'Internal server error' };
  }
}

