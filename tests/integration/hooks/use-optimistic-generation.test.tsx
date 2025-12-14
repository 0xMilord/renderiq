/**
 * Integration tests for useOptimisticGeneration hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOptimisticGeneration } from '@/lib/hooks/use-optimistic-generation';

describe('useOptimisticGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useOptimisticGeneration());

    expect(result.current.optimisticRenders).toEqual([]);
    expect(typeof result.current.addOptimisticRender).toBe('function');
    expect(typeof result.current.removeOptimisticRender).toBe('function');
  });

  it('should add optimistic render', () => {
    const { result } = renderHook(() => useOptimisticGeneration());

    result.current.addOptimisticRender({
      id: 'temp-1',
      prompt: 'Test',
      status: 'processing',
    } as any);

    expect(result.current.optimisticRenders.length).toBe(1);
  });

  it('should remove optimistic render', () => {
    const { result } = renderHook(() => useOptimisticGeneration());

    result.current.addOptimisticRender({
      id: 'temp-1',
      prompt: 'Test',
    } as any);

    result.current.removeOptimisticRender('temp-1');

    expect(result.current.optimisticRenders.length).toBe(0);
  });
});

