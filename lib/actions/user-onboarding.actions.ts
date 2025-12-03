'use server';

import { UserOnboardingService } from '@/lib/services/user-onboarding';
import { logger } from '@/lib/utils/logger';
import { headers } from 'next/headers';
import { getClientIdentifier } from '@/lib/utils/rate-limit';
import type { DeviceFingerprintInput } from '@/lib/services/sybil-detection';

export async function getUserProfileAction(userId: string) {
  logger.log('👤 UserOnboardingAction: Getting user profile for:', userId);
  
  const result = await UserOnboardingService.getUserProfile(userId);
  
  return result;
}

export async function createUserProfileAction(
  userProfile: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    provider?: string;
  },
  deviceFingerprint?: DeviceFingerprintInput
) {
  logger.log('👤 UserOnboardingAction: Creating user profile for:', userProfile.email);
  
  // Try to get device fingerprint from cookie if not provided
  let fingerprint = deviceFingerprint;
  if (!fingerprint) {
    try {
      const headersList = await headers();
      const cookieHeader = headersList.get('cookie');
      const fingerprintCookie = cookieHeader
        ?.split(';')
        .find(c => c.trim().startsWith('device_fingerprint='));
      
      if (fingerprintCookie) {
        const cookieData = decodeURIComponent(fingerprintCookie.split('=')[1]);
        const parsed = JSON.parse(cookieData);
        fingerprint = {
          userAgent: parsed.userAgent || headersList.get('user-agent') || '',
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
      }
    } catch (error) {
      logger.warn('⚠️ UserOnboardingAction: Failed to parse fingerprint cookie:', error);
    }
  }

  // Create minimal fingerprint from headers if still not available
  if (!fingerprint) {
    try {
      const headersList = await headers();
      const userAgent = headersList.get('user-agent') || '';
      fingerprint = {
        userAgent,
        language: headersList.get('accept-language')?.split(',')[0] || 'en',
        timezone: 'UTC', // Can't detect from server
        platform: 'unknown',
        cookieEnabled: true,
      };
    } catch (error) {
      logger.warn('⚠️ UserOnboardingAction: Failed to create minimal fingerprint:', error);
    }
  }

  // Get request context for sybil detection
  let requestContext;
  if (fingerprint) {
    try {
      const headersList = await headers();
      const ipAddress = getClientIdentifier(new Headers(headersList as any));
      requestContext = {
        deviceFingerprint: fingerprint,
        request: new Request('http://localhost', { headers: headersList as any }),
        ipAddress,
      };
    } catch (error) {
      logger.warn('⚠️ UserOnboardingAction: Failed to create request context:', error);
    }
  }
  
  const result = await UserOnboardingService.createUserProfile(userProfile, requestContext);
  
  return result;
}

export async function updateUserProfileAction(userId: string, updates: {
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
}) {
  logger.log('👤 UserOnboardingAction: Updating user profile for:', userId);
  
  const result = await UserOnboardingService.updateUserProfile(userId, updates);
  
  return result;
}
