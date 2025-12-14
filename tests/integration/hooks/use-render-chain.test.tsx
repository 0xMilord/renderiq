/**
 * Integration tests for useRenderChain hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenderChain } from '@/lib/hooks/use-render-chain';

// Mock dependencies
vi.mock('@/lib/actions/render.actions', () => ({
  createRenderAction: vi.fn(),
}));

vi.mock('@/lib/actions/projects.actions', () => ({
  getProjectChains: vi.fn(),
}));

describe('useRenderChain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRenderChain('chain-123'));

    expect(result.current.chain).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should fetch chain data', async () => {
    const mockChain = { id: 'chain-123', name: 'Test Chain' };
    
    // Mock the chain fetch
    vi.mocked(require('@/lib/actions/projects.actions').getProjectChains).mockResolvedValue({
      success: true,
      data: [mockChain] as any,
    });

    const { result } = renderHook(() => useRenderChain('chain-123'));

    // Wait for chain to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });
  });
});

