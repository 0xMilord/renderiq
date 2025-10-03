'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signInAction, signUpAction, signOutAction, signInWithGoogleAction, signInWithGithubAction } from '@/lib/actions/auth.actions';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInAction(email, password);
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await signUpAction(email, password, name);
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  };

  const signOut = async () => {
    try {
      await signOutAction();
      return { error: null };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
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
