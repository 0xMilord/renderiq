import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';

/**
 * GET /api/sketchup-extension/renders/[renderId]
 * Get render status for SketchUp extension
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ renderId: string }> }
) {
  try {
    const { renderId } = await params;

    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLog('sketchup_render_status_missing_token', {}, 'warn');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client and verify token
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      securityLog('sketchup_render_status_invalid_token', { error: userError?.message }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get render
    const render = await RendersDAL.getById(renderId);

    if (!render) {
      return NextResponse.json(
        { success: false, error: 'Render not found' },
        { status: 404 }
      );
    }

    // Verify render belongs to user
    if (render.userId !== user.id) {
      securityLog('sketchup_render_status_unauthorized', { renderId, userId: user.id }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logger.log('✅ SketchUp Extension: Render status retrieved', {
      renderId,
      userId: user.id,
      status: render.status,
    });

    return NextResponse.json({
      success: true,
      status: render.status,
      outputUrl: render.outputUrl,
      error: render.errorMessage,
      createdAt: render.createdAt,
      updatedAt: render.updatedAt,
    });
  } catch (error) {
    logger.error('❌ SketchUp Extension: Get render status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

