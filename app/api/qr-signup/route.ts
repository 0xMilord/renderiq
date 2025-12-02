import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAuthRedirectUrl, getOAuthCallbackUrl } from '@/lib/utils/auth-redirect';
import { logger } from '@/lib/utils/logger';

/**
 * QR Signup Route
 * 
 * This route is designed to be converted to a QR code for visiting cards.
 * When someone scans the QR code and lands here, they are automatically
 * redirected to Google OAuth for seamless signup/login.
 * 
 * Flow:
 * 1. User scans QR code → lands on /api/qr-signup
 * 2. Route redirects to Google OAuth
 * 3. After OAuth, user is redirected to /auth/callback?next=/dashboard
 * 4. Callback creates user profile and redirects to dashboard
 * 
 * Usage:
 * - Generate QR code with URL: https://yourdomain.com/api/qr-signup
 * - Works for both new signups and existing users
 */
export async function GET(request: Request) {
  logger.log('📱 QR Signup: Processing QR signup request');
  
  try {
    const { origin } = new URL(request.url);
    const supabase = await createClient();
    
    // Check if user is already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      logger.log('✅ QR Signup: User already authenticated, redirecting to dashboard');
      // User is already logged in, redirect to dashboard
      const siteUrl = getAuthRedirectUrl(request);
      return NextResponse.redirect(`${siteUrl}/dashboard`);
    }
    
    // Get the correct OAuth callback URL (handles localhost in dev)
    const redirectTo = getOAuthCallbackUrl(request, '/dashboard');
    
    logger.log('📱 QR Signup: Initiating Google OAuth with redirect:', redirectTo);
    
    // Initiate Google OAuth sign-in
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // Enable account selector for Google accounts
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      logger.error('❌ QR Signup: OAuth initiation failed:', error.message);
      // Redirect to login page with error
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (!data.url) {
      logger.error('❌ QR Signup: No OAuth URL returned');
      return NextResponse.redirect(`${origin}/login?error=Failed to initiate signup`);
    }

    logger.log('✅ QR Signup: Redirecting to Google OAuth');
    // Redirect to Google OAuth
    return NextResponse.redirect(data.url);
  } catch (error) {
    logger.error('❌ QR Signup: Unexpected error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`
    );
  }
}

