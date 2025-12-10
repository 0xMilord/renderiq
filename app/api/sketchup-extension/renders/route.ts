import { NextRequest, NextResponse } from 'next/server';
import { getUserFromBearerToken } from '@/lib/services/sketchup-auth';
import { handleRenderRequest } from '@/app/api/renders/route';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';

/**
 * POST /api/sketchup-extension/renders
 * Create render request from SketchUp extension
 * Wraps the main render handler with Bearer token authentication
 * 
 * This endpoint accepts Bearer token authentication and converts it
 * to a session cookie format that the main render handler expects.
 */
export async function POST(request: NextRequest) {
  try {
    // Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLog('sketchup_render_missing_token', {}, 'warn');
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token and get user
    const { user, error: authError } = await getUserFromBearerToken(token);

    if (authError || !user) {
      securityLog('sketchup_render_invalid_token', { error: authError }, 'warn');
      return NextResponse.json(
        { success: false, error: authError || 'Invalid or expired token' },
        { status: 401 }
      );
    }

    logger.log('✅ SketchUp Extension: Render request authenticated', {
      userId: user.id,
      email: user.email,
    });

    // Create a new request with session cookies for the main render handler
    // The main handler uses getCachedUser() which reads from cookies
    // We need to set up the session cookie from the Bearer token
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    // Get session using the token
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Create modified request with cookies
    const url = new URL(request.url);
    const newRequest = new NextRequest(url, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    // Set session cookies if available
    if (sessionData.session) {
      // Set the access token as a cookie for the main handler
      newRequest.headers.set('cookie', 
        `sb-access-token=${token}; ` +
        `sb-refresh-token=${sessionData.session.refresh_token || ''}`
      );
    } else {
      // If no session, try to create one from the token
      // For now, we'll pass the token in a custom header and modify getCachedUser
      // Actually, let's just call the render logic directly with the user
      // This is simpler than trying to fake cookies
      
      // For now, return an error suggesting we need to implement direct render logic
      // TODO: Implement render logic that accepts user directly instead of using cookies
      return NextResponse.json({
        success: false,
        error: 'Session creation from token not yet implemented. Please use web interface.',
      }, { status: 501 });
    }

    // Call the main render handler
    return await handleRenderRequest(newRequest);
    
  } catch (error) {
    logger.error('❌ SketchUp Extension: Render error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

