'use server';

import { AuthService } from '@/lib/services/auth';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

export async function signInAction(email: string, password: string) {
  logger.log('🔐 AuthAction: Sign in action called for:', email);
  
  const result = await AuthService.signIn(email, password);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Redirect to dashboard on successful sign in
  redirect('/');
}

export async function signUpAction(email: string, password: string, name?: string) {
  logger.log('🔐 AuthAction: Sign up action called for:', email);
  
  const result = await AuthService.signUp(email, password, name);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Return success - client will handle showing verification dialog
  // No redirect needed as client-side signup handles the dialog
  return {
    success: true,
    data: result.data,
  };
}

export async function signOutAction() {
  logger.log('🔐 AuthAction: Sign out action called');
  
  const result = await AuthService.signOut();
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Redirect to login page
  redirect('/login');
}

export async function signInWithGoogleAction() {
  logger.log('🔐 AuthAction: Google sign in action called');
  
  const result = await AuthService.signInWithOAuth('google');
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Redirect to OAuth URL
  redirect(result.data.url);
}

export async function signInWithGithubAction() {
  logger.log('🔐 AuthAction: GitHub sign in action called');
  
  const result = await AuthService.signInWithOAuth('github');
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Redirect to OAuth URL
  redirect(result.data.url);
}

export async function getCurrentUserAction() {
  logger.log('🔐 AuthAction: Get current user action called');
  
  const result = await AuthService.getCurrentUser();
  
  return result;
}

export async function refreshSessionAction() {
  logger.log('🔐 AuthAction: Refresh session action called');
  
  const result = await AuthService.refreshSession();
  
  return result;
}
