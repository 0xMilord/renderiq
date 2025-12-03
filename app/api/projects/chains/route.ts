import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RenderChainsDAL } from '@/lib/dal/render-chains';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize database connection' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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

