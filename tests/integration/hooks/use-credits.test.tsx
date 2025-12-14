/**
 * Integration tests for useCredits hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCredits } from '@/lib/hooks/use-credits';
import { useAuth } from '@/lib/hooks/use-auth';
import { getUserCredits } from '@/lib/actions/billing.actions';

// Mock dependencies
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/actions/billing.actions', () => ({
  getUserCredits: vi.fn(),
}));

vi.mock('@/lib/utils/request-deduplication', () => ({
  deduplicateRequest: vi.fn((key, fn) => fn()),
}));

describe('useCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGithub: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCredits());

    expect(result.current.loading).toBe(true);
  });

  it('should fetch credits when user is available', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGithub: vi.fn(),
    } as any);

    vi.mocked(getUserCredits).mockResolvedValue({
      success: true,
      credits: {
        balance: 1000,
        totalEarned: 2000,
        totalSpent: 1000,
      },
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.credits).toBeDefined();
    expect(result.current.credits?.balance).toBe(1000);
  });

  it('should not fetch credits when user is not available', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGithub: vi.fn(),
    } as any);

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getUserCredits).not.toHaveBeenCalled();
    expect(result.current.credits).toBeNull();
  });

  it('should handle errors when fetching credits', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGithub: vi.fn(),
    } as any);

    vi.mocked(getUserCredits).mockResolvedValue({
      success: false,
      error: 'Failed to fetch credits',
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.credits).toBeNull();
  });

  it('should refresh credits when refreshCredits is called', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithGithub: vi.fn(),
    } as any);

    vi.mocked(getUserCredits).mockResolvedValue({
      success: true,
      credits: {
        balance: 1000,
        totalEarned: 2000,
        totalSpent: 1000,
      },
    });

    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update mock for refresh
    vi.mocked(getUserCredits).mockResolvedValue({
      success: true,
      credits: {
        balance: 1500,
        totalEarned: 2500,
        totalSpent: 1000,
      },
    });

    await result.current.refreshCredits();

    await waitFor(() => {
      expect(result.current.credits?.balance).toBe(1500);
    });
  });
});

