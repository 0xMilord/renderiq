/**
 * Integration tests for useCanvas hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvas } from '@/lib/hooks/use-canvas';

// Mock canvas service
vi.mock('@/lib/services/canvas.service', () => ({
  canvasService: {
    saveCanvasState: vi.fn(),
    loadCanvasState: vi.fn(),
  },
}));

describe('useCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCanvas('render-123'));

    expect(result.current.canvasState).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should provide save and load functions', () => {
    const { result } = renderHook(() => useCanvas('render-123'));

    expect(typeof result.current.saveCanvasState).toBe('function');
    expect(typeof result.current.loadCanvasState).toBe('function');
  });
});

