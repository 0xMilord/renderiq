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
  
  // ✅ Use centralized fingerprint parser utility
  let fingerprint = deviceFingerprint;
  if (!fingerprint) {
    try {
      const headersList = await headers();
      const cookieHeader = headersList.get('cookie');
      
      // Convert headers() result to Headers object for utility function
      const headersObj = new Headers();
      headersList.forEach((value, key) => {
        headersObj.set(key, value);
      });
      
      // Create a minimal Request object for the utility
      const mockRequest = new Request('http://localhost', { headers: headersObj });
      const { getFingerprintFromRequest } = await import('@/lib/utils/fingerprint-parser');
      fingerprint = getFingerprintFromRequest(mockRequest);
    } catch (error) {
      logger.warn('⚠️ UserOnboardingAction: Failed to get fingerprint:', error);
    }
  }

  // Get request context for sybil detection
  let requestContext;
  if (fingerprint) {
    try {
      const headersList = await headers();
      // Convert headers() result to Headers object
      const headersObj = new Headers();
      headersList.forEach((value, key) => {
        headersObj.set(key, value);
      });
      const ipAddress = getClientIdentifier(headersObj);
      requestContext = {
        deviceFingerprint: fingerprint,
        request: new Request('http://localhost', { headers: headersObj }),
        ipAddress,
      };
    } catch (error) {
      logger.warn('⚠️ UserOnboardingAction: Failed to create request context:', error);
      // Continue without request context - not critical
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
