import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';

/**
 * GET /api/sketchup-extension/auth/me
 * Get current user info from Bearer token
 */
export async function GET(request: NextRequest) {
  try {
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLog('sketchup_auth_missing_token', {}, 'warn');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the token
    const supabase = await createClient();
    
    // Set the session using the access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      securityLog('sketchup_auth_invalid_token', { error: userError?.message }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    logger.log('✅ SketchUp Extension: User info retrieved', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    logger.error('❌ SketchUp Extension: Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

