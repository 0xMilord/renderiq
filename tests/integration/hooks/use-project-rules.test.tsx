/**
 * Integration tests for useProjectRules hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectRules, useActiveProjectRules } from '@/lib/hooks/use-project-rules';
import { getProjectRules, getActiveProjectRules } from '@/lib/actions/project-rules.actions';

vi.mock('@/lib/actions/project-rules.actions', () => ({
  getProjectRules: vi.fn(),
  getActiveProjectRules: vi.fn(),
}));

vi.mock('@/lib/utils/request-deduplication', () => ({
  deduplicateRequest: vi.fn((key, fn) => fn()),
}));

describe('useProjectRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getProjectRules).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useProjectRules('chain-id'));

    expect(result.current.loading).toBe(true);
    expect(result.current.rules).toEqual([]);
  });

  it('should fetch project rules', async () => {
    const mockRules = [
      { id: 'rule-1', rule: 'Test rule', isActive: true },
    ];

    vi.mocked(getProjectRules).mockResolvedValue({
      success: true,
      data: mockRules,
    });

    const { result } = renderHook(() => useProjectRules('chain-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rules).toEqual(mockRules);
  });

  it('should not fetch if chainId is undefined', () => {
    const { result } = renderHook(() => useProjectRules(undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.rules).toEqual([]);
    expect(getProjectRules).not.toHaveBeenCalled();
  });

  it('should support refresh', async () => {
    vi.mocked(getProjectRules).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useProjectRules('chain-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.refresh();

    await waitFor(() => {
      expect(getProjectRules).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useActiveProjectRules', () => {
  it('should fetch only active rules', async () => {
    const mockRules = [
      { id: 'rule-1', rule: 'Active rule', isActive: true },
    ];

    vi.mocked(getActiveProjectRules).mockResolvedValue({
      success: true,
      data: mockRules,
    });

    const { result } = renderHook(() => useActiveProjectRules('chain-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.rules).toEqual(mockRules);
  });
});

