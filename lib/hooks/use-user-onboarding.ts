'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createUserProfileAction } from '@/lib/actions/user-onboarding.actions';
import { logger } from '@/lib/utils/logger';
import { collectDeviceFingerprint, storeFingerprintInCookie, getFingerprintFromCookie } from '@/lib/utils/client-fingerprint';
import type { DeviceFingerprintInput } from '@/lib/services/sybil-detection';

export function useUserOnboarding() {
  const { 
    user, 
    userProfile, 
    onboardingComplete, 
    profileLoading, 
    loading: authLoading,
    setOnboardingComplete,
    setUserProfile
  } = useAuthStore();
  
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  useEffect(() => {
    const handleUserOnboarding = async () => {
      // ✅ FIXED: Don't duplicate profile fetching - let store handle it
      if (!user || authLoading) return;

      // If we have a profile, onboarding is complete
      if (userProfile) {
        setOnboardingComplete(true);
        setOnboardingError(null); // Clear any previous errors
        return;
      }

      // ✅ FIXED: Only trigger profile creation if:
      // 1. User exists
      // 2. No profile exists
      // 3. Not currently loading profile (prevents race condition)
      // 4. Email is verified (for email/password signups)
      // 5. Wait for store's fetchUserProfile to complete first
      if (!userProfile && !profileLoading && user.email_confirmed_at) {
        // ✅ FIXED: Wait a bit for store's fetchUserProfile to complete
        // This prevents race condition where hook checks before store finishes fetching
        // Store's fetchUserProfile runs on initialize() and onAuthStateChange
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Re-check profile after waiting (store might have fetched it)
        const currentState = useAuthStore.getState();
        if (currentState.userProfile) {
          setOnboardingComplete(true);
          return;
        }
        
        // Check if profile exists on server (might be created by callback)
        // This prevents race condition with OAuth callback
        const { getUserProfileAction } = await import('@/lib/actions/user-onboarding.actions');
        const existingProfile = await getUserProfileAction(user.id);
        
        if (existingProfile.success && existingProfile.data) {
          // Profile exists, just update state
          setUserProfile(existingProfile.data);
          setOnboardingComplete(true);
          setOnboardingError(null); // Clear any previous errors
          return;
        }

        // Profile doesn't exist, create it
        setOnboardingLoading(true);
        
        try {
          logger.log('👤 UserOnboarding Hook: Creating user profile for:', user.email);
          
          // Collect device fingerprint if available
          let deviceFingerprint: DeviceFingerprintInput | undefined;
          try {
            // Try to get from cookie first (set before email verification)
            const cookieFingerprint = getFingerprintFromCookie();
            if (cookieFingerprint) {
              deviceFingerprint = cookieFingerprint;
            } else {
              // Collect fresh fingerprint
              const fingerprint = collectDeviceFingerprint();
              storeFingerprintInCookie(fingerprint);
              deviceFingerprint = fingerprint;
            }
          } catch (error) {
            logger.warn('⚠️ UserOnboarding Hook: Failed to collect fingerprint:', error);
            // Continue without fingerprint - will use minimal detection
          }
          
          // Create user profile and initialize credits using server action
          const onboardingResult = await createUserProfileAction({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            provider: user.app_metadata?.provider || 'email',
          }, deviceFingerprint);

          if (onboardingResult.success && onboardingResult.data) {
            logger.log('✅ UserOnboarding Hook: User onboarding completed successfully');
            setUserProfile(onboardingResult.data);
            setOnboardingComplete(true);
            setOnboardingError(null); // Clear any previous errors
          } else {
            const errorMessage = onboardingResult.error || 'Failed to create user profile';
            console.error('❌ UserOnboarding Hook: User onboarding failed:', errorMessage);
            setOnboardingError(errorMessage);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during onboarding';
          console.error('❌ UserOnboarding Hook: Error during onboarding:', errorMessage);
          setOnboardingError(errorMessage);
        } finally {
          setOnboardingLoading(false);
        }
      }
    };

    handleUserOnboarding();
  }, [user, userProfile, authLoading, profileLoading, setOnboardingComplete, setUserProfile]);
  
  // Clear error when user changes (new user, different session)
  useEffect(() => {
    if (!user) {
      setOnboardingError(null);
    }
  }, [user]);

  return {
    onboardingComplete,
    onboardingLoading: onboardingLoading || profileLoading,
    isOnboarding: !onboardingComplete && !onboardingLoading && !profileLoading && !!user,
    onboardingError, // ✅ ADDED: Error state for components to display
  };
}
