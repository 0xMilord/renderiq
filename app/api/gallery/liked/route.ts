import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const likedItems = await RendersDAL.getUserLikedItems(userId, 100, 0);

    return NextResponse.json({
      items: likedItems,
      count: likedItems.length,
    });
  } catch (error) {
    logger.error('❌ Gallery API: Error fetching liked items:', error);
    
    Sentry.setContext('gallery_api', {
      route: '/api/gallery/liked',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



