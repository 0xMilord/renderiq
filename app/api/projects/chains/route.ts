import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RenderChainsDAL } from '@/lib/dal/render-chains';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const chains = await RenderChainsDAL.getUserChainsWithRenders(user.id);
    
    return NextResponse.json({
      success: true,
      data: chains
    });
  } catch (error) {
    console.error('Error fetching chains:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch chains' 
      },
      { status: 500 }
    );
  }
}

