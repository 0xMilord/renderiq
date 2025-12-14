/**
 * Integration tests for useRenderiqCanvas hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenderiqCanvas } from '@/lib/hooks/use-renderiq-canvas';
import {
  saveCanvasStateAction,
  loadCanvasStateAction,
  loadChainCanvasStateAction,
  saveChainCanvasStateAction,
} from '@/lib/actions/canvas.actions';

vi.mock('@/lib/actions/canvas.actions', () => ({
  saveCanvasStateAction: vi.fn(),
  loadCanvasStateAction: vi.fn(),
  loadChainCanvasStateAction: vi.fn(),
  saveChainCanvasStateAction: vi.fn(),
}));

vi.mock('@tldraw/tldraw', () => ({
  getSnapshot: vi.fn(() => ({ nodes: [] })),
  loadSnapshot: vi.fn(),
}));

describe('useRenderiqCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRenderiqCanvas());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.editor).toBeNull();
  });

  it('should load canvas state from render', async () => {
    const mockEditor = {
      store: {},
    } as any;

    vi.mocked(loadCanvasStateAction).mockResolvedValue({
      success: true,
      data: {
        canvasData: { nodes: [] },
      },
    } as any);

    const { result } = renderHook(() =>
      useRenderiqCanvas({ currentRenderId: 'render-123' })
    );

    // Set editor manually for test
    result.current.setEditor?.(mockEditor);

    await result.current.loadCanvasState();

    await waitFor(() => {
      expect(loadCanvasStateAction).toHaveBeenCalledWith('render-123');
    });
  });

  it('should load canvas state from chain', async () => {
    const mockEditor = {
      store: {},
    } as any;

    vi.mocked(loadChainCanvasStateAction).mockResolvedValue({
      success: true,
      data: {
        canvasData: { nodes: [] },
      },
    } as any);

    const { result } = renderHook(() =>
      useRenderiqCanvas({ chainId: 'chain-123' })
    );

    result.current.setEditor?.(mockEditor);

    await result.current.loadCanvasState();

    await waitFor(() => {
      expect(loadChainCanvasStateAction).toHaveBeenCalledWith('chain-123');
    });
  });

  it('should save canvas state', async () => {
    const mockEditor = {
      store: {},
    } as any;

    vi.mocked(saveCanvasStateAction).mockResolvedValue({
      success: true,
    });

    vi.mocked(saveChainCanvasStateAction).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() =>
      useRenderiqCanvas({
        chainId: 'chain-123',
        currentRenderId: 'render-123',
      })
    );

    result.current.setEditor?.(mockEditor);

    await result.current.saveCanvasState();

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
  });

  it('should auto-save on interval', async () => {
    vi.useFakeTimers();

    const mockEditor = {
      store: {},
    } as any;

    vi.mocked(saveCanvasStateAction).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() =>
      useRenderiqCanvas({
        currentRenderId: 'render-123',
        autoSave: true,
        autoSaveInterval: 1000,
      })
    );

    result.current.setEditor?.(mockEditor);

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(saveCanvasStateAction).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });
});

