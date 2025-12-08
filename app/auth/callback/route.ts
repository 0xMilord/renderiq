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
const INITIAL_SIGNUP_CREDITS = 10;

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
        // Generate avatar if not provided from OAuth
        let avatarUrl = data.user.user_metadata?.avatar_url;
        if (!avatarUrl) {
          logger.log('🎨 Auth Callback: Generating avatar for user:', data.user.email);
          avatarUrl = AvatarService.generateAvatarFromEmail(data.user.email!, {
            size: 128,
            backgroundColor: ['transparent'],
            backgroundType: ['solid'],
            eyesColor: ['4a90e2', '7b68ee', 'ff6b6b', '4ecdc4', '45b7d1'],
            mouthColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
            shapeColor: ['f4a261', 'e76f51', 'd62828', 'f77f00', 'fcbf49'],
            radius: 8,
          });
        }
        
        // Try to get device fingerprint from cookie (set by client before OAuth)
        let deviceFingerprint: DeviceFingerprintInput | undefined;
        const fingerprintCookie = request.headers.get('cookie')
          ?.split(';')
          .find(c => c.trim().startsWith('device_fingerprint='));
        
        if (fingerprintCookie) {
          try {
            const cookieData = decodeURIComponent(fingerprintCookie.split('=')[1]);
            const parsed = JSON.parse(cookieData);
            deviceFingerprint = {
              userAgent: parsed.userAgent || request.headers.get('user-agent') || '',
              language: parsed.language || 'en',
              timezone: parsed.timezone || 'UTC',
              screenResolution: parsed.screenResolution,
              colorDepth: parsed.colorDepth,
              hardwareConcurrency: parsed.hardwareConcurrency,
              deviceMemory: parsed.deviceMemory,
              platform: parsed.platform || 'unknown',
              cookieEnabled: parsed.cookieEnabled !== false,
              doNotTrack: parsed.doNotTrack,
              plugins: parsed.plugins,
              canvasFingerprint: parsed.canvasFingerprint,
            };
          } catch (error) {
            logger.warn('⚠️ Auth Callback: Failed to parse device fingerprint cookie:', error);
          }
        }

        // Fallback: create minimal fingerprint from request headers
        if (!deviceFingerprint) {
          const userAgent = request.headers.get('user-agent') || '';
          // Try to get timezone from cookie if available
          const timezoneCookie = request.headers.get('cookie')
            ?.split(';')
            .find(c => c.trim().startsWith('timezone='));
          const timezone = timezoneCookie 
            ? decodeURIComponent(timezoneCookie.split('=')[1]) 
            : 'UTC';
          
          deviceFingerprint = {
            userAgent,
            language: request.headers.get('accept-language')?.split(',')[0] || 'en',
            timezone,
            platform: 'unknown',
            cookieEnabled: true,
          };
        }
        
        // Create user profile with sybil detection (only for verified users)
        logger.log('👤 Auth Callback: Creating user profile for verified user:', data.user.email);
        const ipAddress = getClientIdentifier(request);
        const profileResult = await UserOnboardingService.createUserProfile(
          {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.user_metadata?.full_name,
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
          // Try to ensure credits are initialized even if profile creation partially failed
          // Check if user exists but credits don't
          try {
            const existingUser = await AuthDAL.getUserById(data.user.id);
            if (existingUser) {
              // User exists, check if credits exist
              const existingCredits = await AuthDAL.getUserCredits(data.user.id);
              if (!existingCredits) {
                logger.log('💰 Auth Callback: User exists but no credits, initializing default credits');
                await UserOnboardingService.initializeUserCredits(data.user.id, INITIAL_SIGNUP_CREDITS);
              }
            }
          } catch (error) {
            logger.error('❌ Auth Callback: Failed to initialize credits after profile creation failure:', error);
          }
        } else {
          logger.log('✅ Auth Callback: User profile created successfully');
          if (profileResult.sybilDetection) {
            logger.log('🔍 Auth Callback: Sybil detection result', {
              riskScore: profileResult.sybilDetection.riskScore,
              riskLevel: profileResult.sybilDetection.riskLevel,
            });
          }

          // Track ambassador referral if present in cookies
          try {
            const cookies = request.headers.get('cookie') || '';
            const ambassadorRefMatch = cookies.match(/ambassador_ref=([^;]+)/);
            if (ambassadorRefMatch) {
              const referralCode = ambassadorRefMatch[1];
              logger.log('🔗 Auth Callback: Tracking ambassador referral:', referralCode);
              
              const { AmbassadorService } = await import('@/lib/services/ambassador.service');
              await AmbassadorService.trackSignup(referralCode, data.user.id);
            }
          } catch (error) {
            logger.warn('⚠️ Auth Callback: Failed to track ambassador referral:', error);
            // Don't fail auth if referral tracking fails
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
    }
  }

  logger.log('❌ Auth Callback: No code or error occurred, redirecting to login');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}


