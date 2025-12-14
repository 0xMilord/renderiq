/**
 * Integration tests for useUser hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@/lib/hooks/use-user';
import { useAuthStore } from '@/lib/stores/auth-store';

vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user from store', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      loading: false,
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('should return null when no user', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      loading: false,
    } as any);

    const { result } = renderHook(() => useUser());

    expect(result.current.user).toBeNull();
  });
});

