import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getAuthRedirectUrl } from '@/lib/utils/auth-redirect';
import { handleCORSPreflight, withCORS } from '@/lib/middleware/cors';

export async function POST(request: NextRequest) {
  // ⚡ Fast path: Handle CORS preflight immediately
  const preflight = handleCORSPreflight(request);
  if (preflight) return preflight;

  try {
    const { email } = await request.json();

    if (!email) {
      const validationErrorResponse = NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
      return withCORS(validationErrorResponse, request);
    }

    // ⚠️ DISABLED RESEND: Now uses Supabase's native email sending with custom templates
    // Supabase automatically sends emails using templates configured in Dashboard → Authentication → Email Templates
    const supabase = await createClient();
    // CRITICAL: Always use production URL, never localhost
    const baseUrl = getAuthRedirectUrl(request);
    const emailRedirectTo = `${baseUrl}/reset-password`;
    
    logger.log('🔧 ForgotPassword: emailRedirectTo:', emailRedirectTo);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: emailRedirectTo,
    });

    if (resetError) {
      logger.error('❌ ForgotPassword: Failed to send password reset:', resetError);
      // Don't reveal if email exists or not for security
      const errorResponse = NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
      return withCORS(errorResponse, request);
    }

    logger.log('✅ ForgotPassword: Password reset email sent via Supabase (custom templates):', email);

    const successResponse = NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
    return withCORS(successResponse, request);
  } catch (error) {
    logger.error('❌ ForgotPassword: Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return withCORS(errorResponse, request);
  }
}

