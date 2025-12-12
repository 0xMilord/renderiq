import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserCache } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

/**
 * API route to invalidate auth cache for a user
 * Called during signout to ensure server cache is cleared immediately
 */
export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const { userId } = await request.json();
    
    if (!userId || typeof userId !== 'string') {
      const validationErrorResponse = NextResponse.json(
        { success: false, error: 'Invalid userId' },
        { status: 400 }
      );
      return withCORS(validationErrorResponse, request);
    }
    
    await invalidateUserCache(userId);
    logger.log('✅ Cache invalidated for user:', userId);
    
    const successResponse = NextResponse.json({ success: true });
    return withCORS(successResponse, request);
  } catch (error) {
    logger.error('❌ Failed to invalidate cache:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}

