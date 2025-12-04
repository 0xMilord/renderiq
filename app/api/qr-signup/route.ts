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
 * 
 * Note: This route includes OG metadata in the HTML for social media sharing,
 * but immediately redirects users to OAuth for seamless signup.
 */
export async function GET(request: Request) {
  logger.log('📱 QR Signup: Processing QR signup request');
  
  try {
    const { origin } = new URL(request.url);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
    const supabase = await createClient();
    
    // Check user agent to detect social media crawlers (for OG metadata)
    const userAgent = request.headers.get('user-agent') || '';
    const isSocialCrawler = /facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Slackbot|SkypeUriPreview|Applebot|Googlebot/i.test(userAgent);
    
    // If it's a social media crawler, return HTML with OG metadata
    if (isSocialCrawler) {
      const ogHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up with Renderiq | QR Code Signup - AI Architectural Visualization</title>
  <meta name="description" content="Scan the QR code to sign up for Renderiq instantly. Join thousands of architects using AI-powered visualization to transform their design workflow. Free tier available.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/api/qr-signup">
  <meta property="og:title" content="Sign Up with Renderiq | QR Code Signup - AI Architectural Visualization">
  <meta property="og:description" content="Scan the QR code to sign up for Renderiq instantly. Join thousands of architects using AI-powered visualization. Free tier available.">
  <meta property="og:image" content="${siteUrl}/og/qr-signup.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Renderiq">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${siteUrl}/api/qr-signup">
  <meta name="twitter:title" content="Sign Up with Renderiq | QR Code Signup">
  <meta name="twitter:description" content="Scan the QR code to sign up for Renderiq instantly. Join thousands of architects using AI-powered visualization.">
  <meta name="twitter:image" content="${siteUrl}/og/qr-signup.jpg">
  <meta name="twitter:creator" content="@Renderiq">
  
  <!-- Redirect for crawlers after they read metadata -->
  <meta http-equiv="refresh" content="0;url=${siteUrl}/api/qr-signup">
</head>
<body>
  <script>window.location.href = '${siteUrl}/api/qr-signup';</script>
  <p>Redirecting to signup...</p>
</body>
</html>`;
      
      return new NextResponse(ogHtml, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Regular user flow - check if already authenticated
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

