/**
 * Integration tests for useGallery hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGallery } from '@/lib/hooks/use-gallery';
import { getPublicGallery, likeGalleryItem, unlikeGalleryItem } from '@/lib/actions/gallery.actions';

vi.mock('@/lib/actions/gallery.actions', () => ({
  getPublicGallery: vi.fn(),
  likeGalleryItem: vi.fn(),
  unlikeGalleryItem: vi.fn(),
  batchCheckUserLiked: vi.fn(),
}));

describe('useGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getPublicGallery).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useGallery());

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('should fetch gallery items', async () => {
    const mockItems = [
      { id: 'item-1', outputUrl: 'https://example.com/image.jpg' },
    ];

    vi.mocked(getPublicGallery).mockResolvedValue({
      success: true,
      data: mockItems,
    });

    const { batchCheckUserLiked } = await import('@/lib/actions/gallery.actions');
    vi.mocked(batchCheckUserLiked).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useGallery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
  });

  it('should support pagination', async () => {
    vi.mocked(getPublicGallery).mockResolvedValue({
      success: true,
      data: Array(20).fill({ id: 'item' }),
    });

    const { batchCheckUserLiked } = await import('@/lib/actions/gallery.actions');
    vi.mocked(batchCheckUserLiked).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useGallery(20));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.loadMore();

    await waitFor(() => {
      expect(getPublicGallery).toHaveBeenCalledTimes(2);
    });
  });

  it('should like gallery item', async () => {
    vi.mocked(getPublicGallery).mockResolvedValue({
      success: true,
      data: [{ id: 'item-1' }],
    });

    const { batchCheckUserLiked } = await import('@/lib/actions/gallery.actions');
    vi.mocked(batchCheckUserLiked).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(likeGalleryItem).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useGallery());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.likeItem('item-1', 'user-id');

    expect(likeGalleryItem).toHaveBeenCalledWith('item-1', 'user-id');
  });
});

