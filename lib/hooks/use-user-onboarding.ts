'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { getUserProfileAction, createUserProfileAction } from '@/lib/actions/user-onboarding.actions';

export function useUserOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    const handleUserOnboarding = async () => {
      if (!user || authLoading) return;

      setOnboardingLoading(true);
      
      try {
        console.log('👤 UserOnboarding Hook: Checking user profile for:', user.email);
        
        // Check if user profile exists using server action
        const profileResult = await getUserProfileAction(user.id);
        
        if (!profileResult.success) {
          console.log('👤 UserOnboarding Hook: User profile not found, creating onboarding');
          
          // Create user profile and initialize credits using server action
          const onboardingResult = await createUserProfileAction({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            provider: user.app_metadata?.provider || 'email',
          });

          if (onboardingResult.success) {
            console.log('✅ UserOnboarding Hook: User onboarding completed successfully');
            setOnboardingComplete(true);
          } else {
            console.error('❌ UserOnboarding Hook: User onboarding failed:', onboardingResult.error);
          }
        } else {
          console.log('✅ UserOnboarding Hook: User profile exists, onboarding complete');
          setOnboardingComplete(true);
        }
      } catch (error) {
        console.error('❌ UserOnboarding Hook: Error during user onboarding:', error);
      } finally {
        setOnboardingLoading(false);
      }
    };

    handleUserOnboarding();
  }, [user, authLoading]);

  return {
    onboardingComplete,
    onboardingLoading,
    isOnboarding: !onboardingComplete && !onboardingLoading && !!user,
  };
}
