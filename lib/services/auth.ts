import { createClient } from '@/lib/supabase/server';
import { UserOnboardingService } from './user-onboarding';
import { AuthDAL } from '@/lib/dal/auth';
import { getOAuthCallbackUrl, getAuthRedirectUrl } from '@/lib/utils/auth-redirect';
import { headers } from 'next/headers';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthResult> {
    logger.log('🔐 AuthService: Signing in user:', email);
    
    try {
      // Validate input
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.issues[0].message,
        };
      }

      const supabase = await createClient();
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('❌ AuthService: Sign in failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        logger.warn('⚠️ AuthService: Email not verified for user:', data.user.id);
        // Sign out the user
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        };
      }

      // Ensure user profile exists (only for verified users)
      // Skip fingerprint for existing users signing in - they already have profile
      if (data.user) {
        const existingUser = await AuthDAL.getUserById(data.user.id);
        if (!existingUser) {
          // Only create profile if it doesn't exist (new user)
          // Note: No fingerprint for sign-in - this is okay as they're existing users
          await UserOnboardingService.createUserProfile({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name,
            avatar: data.user.user_metadata?.avatar_url,
          });
        }
      }

      logger.log('✅ AuthService: Sign in successful:', data.user?.id);
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      logger.error('❌ AuthService: Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  static async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    logger.log('🔐 AuthService: Signing up user:', email);
    
    try {
      // Validate input
      const validation = signUpSchema.safeParse({ email, password, name });
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.issues[0].message,
        };
      }

      const supabase = await createClient();
      
      // Get the correct redirect URL for email verification (handles localhost in dev)
      const emailRedirectTo = getOAuthCallbackUrl(undefined, '/');
      
      // Sign up with Supabase - email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || null,
          },
          emailRedirectTo,
        },
      });

      if (error) {
        logger.error('❌ AuthService: Sign up failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      // DO NOT create user profile here - wait for email verification
      // Profile will be created after email is confirmed via callback

      logger.log('✅ AuthService: Sign up successful, email verification required:', data.user?.id);
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          emailConfirmed: !!data.user?.email_confirmed_at,
        },
      };
    } catch (error) {
      logger.error('❌ AuthService: Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  static async signOut(): Promise<AuthResult> {
    logger.log('🔐 AuthService: Signing out user');
    
    try {
      const supabase = await createClient();
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('❌ AuthService: Sign out failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.log('✅ AuthService: Sign out successful');
      return {
        success: true,
        data: null,
      };
    } catch (error) {
      logger.error('❌ AuthService: Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  static async signInWithOAuth(provider: 'google' | 'github', request?: Request): Promise<AuthResult> {
    logger.log('🔐 AuthService: Signing in with OAuth:', provider);
    
    try {
      const supabase = await createClient();
      
      // Get origin from request or headers (for server actions)
      let origin: string | undefined;
      if (request) {
        try {
          const url = new URL(request.url);
          origin = url.origin;
        } catch (error) {
          logger.warn('Failed to parse request URL:', error);
        }
      } else {
        // For server actions, try to get origin from headers
        try {
          const headersList = await headers();
          const host = headersList.get('host');
          const protocol = headersList.get('x-forwarded-proto') || 'http';
          if (host) {
            origin = `${protocol}://${host}`;
          }
        } catch (error) {
          logger.warn('Failed to get origin from headers:', error);
        }
      }
      
      // Get the correct OAuth callback URL (handles localhost in dev)
      const redirectTo = getOAuthCallbackUrl(request, '/', origin);
      
      logger.log('🔐 AuthService: OAuth redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        logger.error('❌ AuthService: OAuth sign in failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.log('✅ AuthService: OAuth sign in initiated:', provider);
      return {
        success: true,
        data: {
          url: data.url,
        },
      };
    } catch (error) {
      logger.error('❌ AuthService: OAuth sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth sign in failed',
      };
    }
  }

  static async getCurrentUser(): Promise<AuthResult> {
    logger.log('🔐 AuthService: Getting current user');
    
    try {
      const supabase = await createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.error('❌ AuthService: Get user failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.log('✅ AuthService: User retrieved:', user?.id);
      return {
        success: true,
        data: { user },
      };
    } catch (error) {
      logger.error('❌ AuthService: Get user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get user failed',
      };
    }
  }

  static async refreshSession(): Promise<AuthResult> {
    logger.log('🔐 AuthService: Refreshing session');
    
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error('❌ AuthService: Refresh session failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.log('✅ AuthService: Session refreshed');
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      logger.error('❌ AuthService: Refresh session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refresh session failed',
      };
    }
  }
}
