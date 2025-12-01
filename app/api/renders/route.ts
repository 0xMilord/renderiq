import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import { createRenderAction } from '@/lib/actions/render.actions';

/**
 * @deprecated This API route is deprecated. Use the server action `createRenderAction` from '@/lib/actions/render.actions' instead.
 * This route is kept for backward compatibility but will be removed in a future version.
 */
export async function POST(request: NextRequest) {
  try {
    logger.log('🚀 Starting render generation API call (deprecated - use server action instead)');
    
    // Convert NextRequest to FormData for server action
    const formData = await request.formData();
    
    // Use the server action instead
    const result = await createRenderAction(formData);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    logger.error('❌ API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const renders = await RendersDAL.getByUser(user.id, projectId);
    
    return NextResponse.json({ success: true, data: renders });
  } catch (error) {
    logger.error('❌ Get renders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch renders' }, { status: 500 });
  }
}
