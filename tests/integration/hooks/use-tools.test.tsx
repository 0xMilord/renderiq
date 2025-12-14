/**
 * Integration tests for useTools hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTools } from '@/lib/hooks/use-tools';
import { getToolsAction } from '@/lib/actions/tools.actions';

vi.mock('@/lib/actions/tools.actions', () => ({
  getToolsAction: vi.fn(),
}));

describe('useTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getToolsAction).mockResolvedValue({
      success: true,
      tools: [],
    });

    const { result } = renderHook(() => useTools());

    expect(result.current.loading).toBe(true);
  });

  it('should fetch tools on mount', async () => {
    const mockTools = [{ id: '1', name: 'Tool 1' }];
    vi.mocked(getToolsAction).mockResolvedValue({
      success: true,
      tools: mockTools as any,
    });

    const { result } = renderHook(() => useTools());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tools).toEqual(mockTools);
  });

  it('should filter tools by category', async () => {
    vi.mocked(getToolsAction).mockResolvedValue({
      success: true,
      tools: [],
    });

    const { result } = renderHook(() => useTools('transformation'));

    await waitFor(() => {
      expect(getToolsAction).toHaveBeenCalledWith({ category: 'transformation' });
    });
  });
});

