import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserCache } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

/**
 * API route to invalidate auth cache for a user
 * Called during signout to ensure server cache is cleared immediately
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid userId' },
        { status: 400 }
      );
    }
    
    await invalidateUserCache(userId);
    logger.log('✅ Cache invalidated for user:', userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Failed to invalidate cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

