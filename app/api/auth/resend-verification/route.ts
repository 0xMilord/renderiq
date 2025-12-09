import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getAuthRedirectUrl } from '@/lib/utils/auth-redirect';

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
    // CRITICAL: Always use production URL, never localhost
    const baseUrl = getAuthRedirectUrl(request);
    const emailRedirectTo = `${baseUrl}/auth/callback`;
    
    logger.log('🔧 ResendVerification: emailRedirectTo:', emailRedirectTo);
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo,
      },
    });

    if (resendError) {
      logger.error('❌ ResendVerification: Failed to resend verification:', resendError);
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a verification link has been sent.' },
        { status: 200 }
      );
    }

    logger.log('✅ ResendVerification: Verification email sent via Supabase:', email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logger.error('❌ ResendVerification: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

