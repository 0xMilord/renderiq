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
          async (event, session) => {
            logger.log('Auth state changed:', event);
            
            // ✅ PERFORMANCE: Skip slow getUser() on SIGNED_OUT - we already know user is null
            // Calling getUser() on a cleared session causes 30+ second timeout
            if (event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                loading: false,
                userProfile: null,
                onboardingComplete: false 
              });
              return; // Early return - no slow getUser() call
            }
            
            // Note: Supabase doesn't have a SIGNED_UP event
            // User is set directly from signUp() call, so we don't need special handling here
            
            // ✅ SECURITY: Use getUser() to get authenticated user data (only for sign-in events)
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
        // CRITICAL: Use server action to get correct production URL
        // Client-side can't reliably detect production (NODE_ENV may not be available)
        const { signUpAction } = await import('@/lib/actions/auth.actions');
        const result = await signUpAction(email, password, fullName);
        
        if (!result.success || result.error) {
          set({ loading: false });
          return { error: result.error || new Error('Sign up failed') };
        }
        
        // Set user state if available
        if (result.data?.user) {
          set({ user: result.data.user, loading: false });
        } else {
          set({ loading: false });
        }
        
        return { error: null };
      } catch (error) {
        set({ loading: false });
        return { error };
      }
    },

    signOut: async () => {
      // ✅ Don't set loading to true - we want immediate UI update
      // Setting loading to true causes navbar to show skeleton perpetually
      
      try {
        // Get user ID before signing out (for cache invalidation)
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;
        
        // ✅ Clear client state IMMEDIATELY before signout to prevent loading state
        // This ensures navbar updates instantly to show non-auth UI
        set({ 
          user: null, 
          userProfile: null, 
          loading: false,
          onboardingComplete: false 
        });
        
        // Then sign out from Supabase (this will trigger onAuthStateChange)
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Sign out error:', error);
          // Even if signout fails, we've already cleared local state
          // so UI should reflect logged out state
        }
        
        // ✅ Invalidate server cache (fire and forget - don't block signout)
        if (userId) {
          fetch('/api/auth/invalidate-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }).catch(() => {
            // Ignore errors - cache will expire naturally (5min TTL)
            logger.warn('⚠️ Failed to invalidate cache on signout, will expire naturally');
          });
        }
      } catch (error) {
        console.error('Sign out failed:', error);
        // ✅ Ensure loading is false even on error
        set({ 
          user: null, 
          userProfile: null, 
          loading: false,
          onboardingComplete: false 
        });
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
