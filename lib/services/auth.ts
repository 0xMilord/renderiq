import { createClient } from '@/lib/supabase/server';
import { UserOnboardingService } from './user-onboarding';
import { z } from 'zod';

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
    console.log('🔐 AuthService: Signing in user:', email);
    
    try {
      // Validate input
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors[0].message,
        };
      }

      const supabase = await createClient();
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ AuthService: Sign in failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        console.warn('⚠️ AuthService: Email not verified for user:', data.user.id);
        // Sign out the user
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        };
      }

      // Ensure user profile exists (only for verified users)
      if (data.user) {
        await UserOnboardingService.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          avatar: data.user.user_metadata?.avatar_url,
        });
      }

      console.log('✅ AuthService: Sign in successful:', data.user?.id);
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      console.error('❌ AuthService: Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  static async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    console.log('🔐 AuthService: Signing up user:', email);
    
    try {
      // Validate input
      const validation = signUpSchema.safeParse({ email, password, name });
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors[0].message,
        };
      }

      const supabase = await createClient();
      
      // Sign up with Supabase - email confirmation required
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || null,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ AuthService: Sign up failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      // DO NOT create user profile here - wait for email verification
      // Profile will be created after email is confirmed via callback

      console.log('✅ AuthService: Sign up successful, email verification required:', data.user?.id);
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
          emailConfirmed: !!data.user?.email_confirmed_at,
        },
      };
    } catch (error) {
      console.error('❌ AuthService: Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      };
    }
  }

  static async signOut(): Promise<AuthResult> {
    console.log('🔐 AuthService: Signing out user');
    
    try {
      const supabase = await createClient();
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ AuthService: Sign out failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ AuthService: Sign out successful');
      return {
        success: true,
        data: null,
      };
    } catch (error) {
      console.error('❌ AuthService: Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  static async signInWithOAuth(provider: 'google' | 'github'): Promise<AuthResult> {
    console.log('🔐 AuthService: Signing in with OAuth:', provider);
    
    try {
      const supabase = await createClient();
      
      // Determine the correct redirect URL based on environment
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isLocalEnv ? 'http://localhost:3000' : 'https://arqihive.com');
      const redirectTo = `${siteUrl}/auth/callback`;
      
      console.log('🔐 AuthService: OAuth redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error('❌ AuthService: OAuth sign in failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ AuthService: OAuth sign in initiated:', provider);
      return {
        success: true,
        data: {
          url: data.url,
        },
      };
    } catch (error) {
      console.error('❌ AuthService: OAuth sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth sign in failed',
      };
    }
  }

  static async getCurrentUser(): Promise<AuthResult> {
    console.log('🔐 AuthService: Getting current user');
    
    try {
      const supabase = await createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ AuthService: Get user failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ AuthService: User retrieved:', user?.id);
      return {
        success: true,
        data: { user },
      };
    } catch (error) {
      console.error('❌ AuthService: Get user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get user failed',
      };
    }
  }

  static async refreshSession(): Promise<AuthResult> {
    console.log('🔐 AuthService: Refreshing session');
    
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ AuthService: Refresh session failed:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ AuthService: Session refreshed');
      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error) {
      console.error('❌ AuthService: Refresh session error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refresh session failed',
      };
    }
  }
}
