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
        // ✅ OPTIMIZED: Use session?.user when available to avoid slow getUser() calls
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
            
            // ✅ OPTIMIZED: Use session?.user when available (most events provide it)
            // Only call getUser() when session is not provided (rare edge case)
            let authenticatedUser = session?.user || null;
            
            if (!authenticatedUser && event !== 'INITIAL_SESSION') {
              // Only call getUser() if session is not provided and it's not initial session
              // INITIAL_SESSION already handled by initialize() above
              const { data: { user } } = await supabase.auth.getUser();
              authenticatedUser = user || null;
            }
            
            set({ 
              user: authenticatedUser, 
              loading: false 
            });

            // ✅ OPTIMIZED: Skip profile fetch for INITIAL_SESSION (already fetched in initialize())
            // Fetch profile when user signs in, clear when signs out
            if (authenticatedUser && event !== 'INITIAL_SESSION') {
              get().fetchUserProfile();
            } else if (!authenticatedUser) {
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

        // ✅ FIXED: Don't set user state directly - let onAuthStateChange handle it
        // This ensures state is synchronized through a single source of truth
        // onAuthStateChange will fire with SIGNED_IN event and update state
        set({ loading: false });
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
        
        // ✅ FIXED: Don't set user state directly - let onAuthStateChange handle it
        // For email/password signup, user is created but email not confirmed yet
        // onAuthStateChange will handle state updates when email is verified
        // For OAuth signup, onAuthStateChange will fire immediately
        if (result.data?.user) {
          // Set user temporarily for immediate UI feedback
          // onAuthStateChange will sync it properly
          set({ user: result.data.user, loading: false });
          
          // Track signup in GA4 (client-side)
          if (typeof window !== 'undefined' && window.gtag) {
            try {
              const { trackSignupCompleted, initGA4User } = await import('@/lib/utils/ga4-tracking');
              trackSignupCompleted(result.data.user.id, 'email', 'direct');
              initGA4User(result.data.user.id, {
                user_role: 'free',
                signup_source: 'direct',
                signup_date: new Date().toISOString(),
                subscription_status: 'none',
              });
            } catch (error) {
              console.warn('GA4 signup tracking failed:', error);
            }
          }
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
      // Clear GA4 user on signout
      if (typeof window !== 'undefined' && window.gtag) {
        try {
          const { clearGA4User } = await import('@/lib/utils/ga4-tracking');
          clearGA4User();
        } catch (error) {
          console.warn('GA4 signout tracking failed:', error);
        }
      }
      
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
        
        // ✅ IMPROVED: Invalidate server cache with retry logic
        if (userId) {
          const invalidateCache = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
              try {
                const response = await fetch('/api/auth/invalidate-cache', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                });
                
                if (response.ok) {
                  logger.log('✅ Cache invalidated successfully');
                  return;
                }
                
                if (i < retries - 1) {
                  // Wait before retry (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
                }
              } catch (error) {
                if (i === retries - 1) {
                  logger.warn('⚠️ Failed to invalidate cache after retries, will expire naturally (5min TTL)');
                }
              }
            }
          };
          
          // Fire and forget - don't block signout
          invalidateCache().catch(() => {
            // Ignore - cache will expire naturally
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
