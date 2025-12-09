import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getOAuthCallbackUrl } from '@/lib/utils/auth-redirect';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // ⚠️ DISABLED RESEND: Now uses Supabase's native email sending with custom templates
    // Supabase automatically sends emails using templates configured in Dashboard → Authentication → Email Templates
    const supabase = await createClient();
    const emailRedirectTo = getOAuthCallbackUrl(request, '/reset-password');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: emailRedirectTo,
    });

    if (resetError) {
      logger.error('❌ ForgotPassword: Failed to send password reset:', resetError);
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    logger.log('✅ ForgotPassword: Password reset email sent via Supabase (custom templates):', email);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    logger.error('❌ ForgotPassword: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

