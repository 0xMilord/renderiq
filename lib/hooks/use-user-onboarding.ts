'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createUserProfileAction } from '@/lib/actions/user-onboarding.actions';

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

  useEffect(() => {
    const handleUserOnboarding = async () => {
      if (!user || authLoading || profileLoading) return;

      // If we have a profile, onboarding is complete
      if (userProfile) {
        setOnboardingComplete(true);
        return;
      }

      // If no profile and not loading, we need to create one
      if (!userProfile && !profileLoading) {
        setOnboardingLoading(true);
        
        try {
          console.log('👤 UserOnboarding Hook: Creating user profile for:', user.email);
          
          // Create user profile and initialize credits using server action
          const onboardingResult = await createUserProfileAction({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            provider: user.app_metadata?.provider || 'email',
          });

          if (onboardingResult.success && onboardingResult.data) {
            console.log('✅ UserOnboarding Hook: User onboarding completed successfully');
            setUserProfile(onboardingResult.data);
            setOnboardingComplete(true);
          } else {
            console.error('❌ UserOnboarding Hook: User onboarding failed:', onboardingResult.error);
          }
        } catch (error) {
          console.error('❌ UserOnboarding Hook: Error during onboarding:', error);
        } finally {
          setOnboardingLoading(false);
        }
      }
    };

    handleUserOnboarding();
  }, [user, userProfile, authLoading, profileLoading, setOnboardingComplete, setUserProfile]);

  return {
    onboardingComplete,
    onboardingLoading: onboardingLoading || profileLoading,
    isOnboarding: !onboardingComplete && !onboardingLoading && !profileLoading && !!user,
  };
}
