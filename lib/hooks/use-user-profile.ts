'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import type { UserProfile } from '@/lib/stores/auth-store';

export function useUserProfile() {
  const { userProfile, profileLoading, loading: authLoading, fetchUserProfile } = useAuthStore();

  return {
    profile: userProfile,
    loading: authLoading || profileLoading,
    error: null, // Errors are handled in the store
    refetch: fetchUserProfile,
  };
}
