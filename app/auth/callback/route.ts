import { createClient } from '@/lib/supabase/server';
import { UserOnboardingService } from '@/lib/services/user-onboarding';
import { AvatarService } from '@/lib/services/avatar';
import { NextResponse } from 'next/server';
import { getPostAuthRedirectUrl } from '@/lib/utils/auth-redirect';
import { logger } from '@/lib/utils/logger';
import { getClientIdentifier } from '@/lib/utils/rate-limit';
import type { DeviceFingerprintInput } from '@/lib/services/sybil-detection';
import { AuthDAL } from '@/lib/dal/auth';

// Maximum initial credits for new users on signup (trusted users)
const INITIAL_SIGNUP_CREDITS = 25;

export async function GET(request: Request) {
  logger.log('🔄 Auth Callback: Processing OAuth callback');
  logger.log('🔄 Auth Callback: URL:', request.url);
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  logger.log('🔄 Auth Callback: Code:', code ? 'present' : 'missing');
  logger.log('🔄 Auth Callback: Origin:', origin);
  logger.log('🔄 Auth Callback: Next:', next);

  if (code) {
    logger.log('🔐 Auth Callback: Code received, exchanging for session');
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      logger.log('✅ Auth Callback: Session created successfully');
      logger.log('📧 Auth Callback: Email confirmed:', !!data.user.email_confirmed_at);
      
      // Only create profile if email is confirmed
      // OAuth providers (Google, GitHub) auto-confirm emails
      if (data.user.email_confirmed_at) {
        // ✅ OPTIMIZED: Early check if user already exists to avoid unnecessary service call
        const existingUser = await AuthDAL.getUserById(data.user.id);
        if (existingUser) {
          logger.log('✅ Auth Callback: User already exists, skipping profile creation:', data.user.id);
        } else {
          // ✅ REMOVED: Avatar generation - now handled by UserOnboardingService
          // Pass avatar from OAuth metadata, or undefined to let service generate it
          const avatarUrl = data.user.user_metadata?.avatar_url || undefined;
          
          // ✅ Use centralized fingerprint parser utility
          const { getFingerprintFromRequest } = await import('@/lib/utils/fingerprint-parser');
          const deviceFingerprint = getFingerprintFromRequest(request);
          
          // Create user profile with sybil detection (only for verified users)
          logger.log('👤 Auth Callback: Creating user profile for verified user:', data.user.email);
          const ipAddress = getClientIdentifier(request);
          const profileResult = await UserOnboardingService.createUserProfile(
            {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
              avatar: avatarUrl,
            },
            {
              deviceFingerprint,
              request,
              ipAddress,
            }
          );
          
          if (!profileResult.success) {
            logger.error('❌ Auth Callback: Failed to create user profile:', profileResult.error);
            // Profile creation failure is handled by UserOnboardingService
            // Credits initialization and ambassador tracking are handled there
          } else {
            logger.log('✅ Auth Callback: User profile created successfully');
            if (profileResult.sybilDetection) {
              logger.log('🔍 Auth Callback: Sybil detection result', {
                riskScore: profileResult.sybilDetection.riskScore,
                riskLevel: profileResult.sybilDetection.riskLevel,
              });
            }
            // ✅ REMOVED: Ambassador referral tracking - now handled in UserOnboardingService
            // ✅ REMOVED: Credits initialization fallback - now handled in UserOnboardingService
          }
        }
      } else {
        logger.log('⚠️ Auth Callback: Email not verified yet, profile creation skipped');
        // For email/password signups, profile will be created when they verify email
        // The same callback route will be called again after email verification
      }
      
      // Use centralized redirect logic (handles localhost in dev)
      const redirectUrl = getPostAuthRedirectUrl(request, next);
      
      logger.log('🔄 Auth Callback: Final redirect URL:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
      logger.error('❌ Auth Callback: Error exchanging code for session:', error);
      // ✅ IMPROVED: Pass specific error message in redirect
      const errorMessage = error?.message || 'Authentication failed';
      const encodedError = encodeURIComponent(errorMessage);
      return NextResponse.redirect(`${origin}/login?error=${encodedError}`);
    }
  }

  // ✅ IMPROVED: More specific error message
  logger.log('❌ Auth Callback: No code provided, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authentication code provided')}`);
}


