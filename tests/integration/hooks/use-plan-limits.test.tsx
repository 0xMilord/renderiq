/**
 * Integration tests for usePlanLimits hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlanLimits } from '@/lib/hooks/use-plan-limits';
import {
  getUserPlanLimits,
  checkProjectLimit,
  checkRenderLimit,
  checkQualityLimit,
  checkVideoLimit,
} from '@/lib/actions/plan-limits.actions';

vi.mock('@/lib/actions/plan-limits.actions', () => ({
  getUserPlanLimits: vi.fn(),
  checkProjectLimit: vi.fn(),
  checkRenderLimit: vi.fn(),
  checkQualityLimit: vi.fn(),
  checkVideoLimit: vi.fn(),
}));

describe('usePlanLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getUserPlanLimits).mockResolvedValue({
      success: true,
      limits: {
        maxProjects: 10,
        maxRendersPerProject: 100,
      },
    });

    const { result } = renderHook(() => usePlanLimits());

    expect(result.current.loading).toBe(true);
    expect(result.current.limits).toBeNull();
  });

  it('should fetch plan limits on mount', async () => {
    const mockLimits = {
      maxProjects: 10,
      maxRendersPerProject: 100,
    };

    vi.mocked(getUserPlanLimits).mockResolvedValue({
      success: true,
      limits: mockLimits,
    });

    const { result } = renderHook(() => usePlanLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.limits).toEqual(mockLimits);
  });

  it('should check project limit', async () => {
    vi.mocked(getUserPlanLimits).mockResolvedValue({
      success: true,
      limits: {},
    });

    vi.mocked(checkProjectLimit).mockResolvedValue({
      success: true,
      result: {
        allowed: true,
        current: 5,
        limit: 10,
      },
    });

    const { result } = renderHook(() => usePlanLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const checkResult = await result.current.checkProjectLimit();

    expect(checkResult.allowed).toBe(true);
  });

  it('should check render limit', async () => {
    vi.mocked(getUserPlanLimits).mockResolvedValue({
      success: true,
      limits: {},
    });

    vi.mocked(checkRenderLimit).mockResolvedValue({
      success: true,
      result: {
        allowed: true,
        remaining: 50,
      },
    });

    const { result } = renderHook(() => usePlanLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const checkResult = await result.current.checkRenderLimit('project-id');

    expect(checkResult.allowed).toBe(true);
  });
});

