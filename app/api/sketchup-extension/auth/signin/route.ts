import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';

/**
 * POST /api/sketchup-extension/auth/signin
 * Authenticate user for SketchUp extension
 * Returns access token for Bearer authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      securityLog('sketchup_auth_failed', { email, error: authError?.message }, 'warn');
      return NextResponse.json(
        { success: false, error: authError?.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      securityLog('sketchup_session_failed', { email, error: sessionError?.message }, 'warn');
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 401 }
      );
    }

    const session = sessionData.session;
    const accessToken = session.access_token;

    // Calculate expiration (JWT tokens typically expire in 1 hour)
    const expiresAt = new Date(session.expires_at! * 1000).toISOString();

    logger.log('✅ SketchUp Extension: User authenticated', {
      userId: authData.user.id,
      email: authData.user.email,
    });

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_at: expiresAt,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    logger.error('❌ SketchUp Extension: Signin error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

