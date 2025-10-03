'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getUserProfileAction } from '@/lib/actions/user-onboarding.actions';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user || authLoading) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('👤 UserProfile Hook: Fetching profile for:', user.id);
      
      const result = await getUserProfileAction(user.id);
      
      if (result.success && result.data) {
        console.log('✅ UserProfile Hook: Profile loaded:', result.data.id);
        console.log('🎨 UserProfile Hook: Avatar URL:', result.data.avatar ? 'Present' : 'Missing');
        setProfile(result.data);
      } else {
        console.log('❌ UserProfile Hook: Profile not found');
        setProfile(null);
      }
    } catch (err) {
      console.error('❌ UserProfile Hook: Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchProfile();
  }, [user, authLoading, fetchProfile]);

  return {
    profile,
    loading: authLoading || loading,
    error,
    refetch: fetchProfile,
  };
}
