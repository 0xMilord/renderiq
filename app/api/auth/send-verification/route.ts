import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getAuthRedirectUrl } from '@/lib/utils/auth-redirect';

/**
 * API route to resend verification email
 * ⚠️ DISABLED RESEND: Now uses Supabase's native email sending with custom templates
 * Supabase automatically sends emails using templates configured in Dashboard → Authentication → Email Templates
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // ✅ Use Supabase's native resend method - it will use custom templates from Dashboard
    const supabase = await createClient();
    // CRITICAL: Always use production URL, never localhost
    const baseUrl = getAuthRedirectUrl(request);
    const emailRedirectTo = `${baseUrl}/auth/callback`;
    
    logger.log('🔧 SendVerification: emailRedirectTo:', emailRedirectTo);
    
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo,
      },
    });

    if (resendError) {
      logger.error('❌ SendVerification: Failed to resend verification:', resendError);
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a verification link has been sent.' },
        { status: 200 }
      );
    }

    logger.log('✅ SendVerification: Verification email sent via Supabase (custom templates):', email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    logger.error('❌ SendVerification: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

