/**
 * Integration tests for useAuth hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { signInAction, signUpAction, signOutAction, signInWithGoogleAction, signInWithGithubAction } from '@/lib/actions/auth.actions';

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/actions/auth.actions', () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
  signOutAction: vi.fn(),
  signInWithGoogleAction: vi.fn(),
  signInWithGithubAction: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with user and loading state', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('should call store signIn', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any);

    const { result } = renderHook(() => useAuth());

    await result.current.signIn('test@example.com', 'password123');

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should call store signUp', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: mockSignUp,
      signOut: vi.fn(),
    } as any);

    const { result } = renderHook(() => useAuth());

    await result.current.signUp('test@example.com', 'password123', 'Test User');

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
  });

  it('should handle signOut', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
    } as any);

    const { result } = renderHook(() => useAuth());

    await result.current.signOut();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should handle Google sign in', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as any);

    vi.mocked(signInWithGoogleAction).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    const response = await result.current.signInWithGoogle();

    expect(response.error).toBeNull();
  });
});

