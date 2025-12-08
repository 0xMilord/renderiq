'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

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

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  initialized: boolean;
  onboardingComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const supabase = createClient();

  return {
    user: null,
    userProfile: null,
    loading: true,
    profileLoading: false,
    initialized: false,
    onboardingComplete: false,

    initialize: async () => {
      if (get().initialized) return;
      
      set({ loading: true });
      
      try {
        // ✅ SECURITY: Use getUser() instead of getSession() to authenticate with Supabase Auth server
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth initialization error:', error);
        }
        
        set({ 
          user: user || null, 
          loading: false, 
          initialized: true 
        });

        // Fetch user profile if user is authenticated
        if (user) {
          get().fetchUserProfile();
        }

        // Listen for auth changes (onAuthStateChange is fine for client-side reactivity)
        // But we'll use getUser() in the callback to ensure authenticity
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event) => {
            logger.log('Auth state changed:', event);
            
            // ✅ SECURITY: Use getUser() to get authenticated user data
            const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
            
            set({ 
              user: authenticatedUser || null, 
              loading: false 
            });

            // Fetch profile when user signs in, clear when signs out
            if (authenticatedUser) {
              get().fetchUserProfile();
            } else {
              set({ userProfile: null, onboardingComplete: false });
            }
          }
        );

        // Store subscription for cleanup
        (get() as AuthState & { subscription?: { unsubscribe: () => void } }).subscription = subscription;
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        set({ loading: false, initialized: true });
      }
    },

    signIn: async (email: string, password: string) => {
      set({ loading: true });
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ loading: false });
          return { error };
        }

        set({ user: data.user, loading: false });
        return { error: null };
      } catch (error) {
        set({ loading: false });
        return { error };
      }
    },

    signUp: async (email: string, password: string, fullName: string) => {
      set({ loading: true });
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          set({ loading: false });
          return { error };
        }

        set({ user: data.user, loading: false });
        return { error: null };
      } catch (error) {
        set({ loading: false });
        return { error };
      }
    },

    signOut: async () => {
      set({ loading: true });
      
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Sign out error:', error);
        }
        
        set({ user: null, loading: false });
      } catch (error) {
        console.error('Sign out failed:', error);
        set({ loading: false });
      }
    },

    refreshUser: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Refresh user error:', error);
          return;
        }
        
        set({ user });
      } catch (error) {
        console.error('Refresh user failed:', error);
      }
    },

    fetchUserProfile: async () => {
      const { user, userProfile, profileLoading } = get();
      
      if (!user || profileLoading || userProfile) {
        return; // Don't fetch if no user, already loading, or already have profile
      }

      set({ profileLoading: true });
      
      try {
        // Import the action dynamically to avoid circular dependencies
        const { getUserProfileAction } = await import('@/lib/actions/user-onboarding.actions');
        
        logger.log('🔍 AuthStore: Fetching user profile for:', user.id);
        const result = await getUserProfileAction(user.id);
        
        if (result.success && result.data) {
          logger.log('✅ AuthStore: Profile loaded and cached:', result.data.id);
          set({ 
            userProfile: result.data, 
            profileLoading: false,
            onboardingComplete: true 
          });
        } else {
          logger.log('❌ AuthStore: Profile not found, onboarding needed');
          set({ 
            userProfile: null, 
            profileLoading: false,
            onboardingComplete: false 
          });
        }
      } catch (error) {
        console.error('❌ AuthStore: Error fetching profile:', error);
        set({ profileLoading: false });
      }
    },

    setUserProfile: (profile: UserProfile | null) => {
      set({ userProfile: profile });
    },

    setOnboardingComplete: (complete: boolean) => {
      set({ onboardingComplete: complete });
    },
  };
});

// Cleanup function for subscription
export const cleanupAuthStore = () => {
  const state = useAuthStore.getState();
  const stateWithSubscription = state as AuthState & { subscription?: { unsubscribe: () => void } };
  if (stateWithSubscription.subscription) {
    stateWithSubscription.subscription.unsubscribe();
  }
};
