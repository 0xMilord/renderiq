'use client';

import { useUserOnboarding } from '@/lib/hooks/use-user-onboarding';

interface UserOnboardingProviderProps {
  children: React.ReactNode;
}

export function UserOnboardingProvider({ children }: UserOnboardingProviderProps) {
  // This hook handles user onboarding automatically
  useUserOnboarding();

  return <>{children}</>;
}
