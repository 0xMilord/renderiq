'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { signInAction, signUpAction, signOutAction, signInWithGoogleAction, signInWithGithubAction } from '@/lib/actions/auth.actions';

export function useAuth() {
  const router = useRouter();
  const { user, loading, signIn: storeSignIn, signUp: storeSignUp, signOut: storeSignOut } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    return await storeSignIn(email, password);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    return await storeSignUp(email, password, name || '');
  };

  const signOut = async () => {
    await storeSignOut();
    // Redirect to home immediately after logout
    router.push('/');
    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithGoogleAction();
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Google sign in failed' 
      };
    }
  };

  const signInWithGithub = async () => {
    try {
      await signInWithGithubAction();
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'GitHub sign in failed' 
      };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
  };
}
