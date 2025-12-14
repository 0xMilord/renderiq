/**
 * Integration tests for useSubscription hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { getUserSubscriptionAction } from '@/lib/actions/billing.actions';

vi.mock('@/lib/actions/billing.actions', () => ({
  getUserSubscriptionAction: vi.fn(),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    loading: false,
  }),
}));

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getUserSubscriptionAction).mockResolvedValue({
      success: true,
      data: null,
    });

    const { result } = renderHook(() => useSubscription());

    expect(result.current.loading).toBe(true);
  });

  it('should fetch subscription', async () => {
    const mockSubscription = {
      id: 'sub-123',
      planId: 'pro',
      status: 'active',
    };

    vi.mocked(getUserSubscriptionAction).mockResolvedValue({
      success: true,
      data: mockSubscription as any,
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toEqual(mockSubscription);
  });
});

