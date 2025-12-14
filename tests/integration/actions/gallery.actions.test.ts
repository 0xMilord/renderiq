/**
 * Integration tests for gallery actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPublicGallery,
  getLongestChains,
  likeGalleryItem,
  unlikeGalleryItem,
} from '@/lib/actions/gallery.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { RendersDAL } from '@/lib/dal/renders';
import { db } from '@/lib/db';

vi.mock('@/lib/dal/renders', () => ({
  RendersDAL: {
    getPublicGallery: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('Gallery Actions', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('getPublicGallery', () => {
    it('should get public gallery items', async () => {
      vi.mocked(RendersDAL.getPublicGallery).mockResolvedValue([
        { id: 'item-1', outputUrl: 'https://example.com/image.jpg' },
      ] as any);

      const result = await getPublicGallery(1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should support pagination', async () => {
      vi.mocked(RendersDAL.getPublicGallery).mockResolvedValue([]);

      await getPublicGallery(2, 20);

      expect(RendersDAL.getPublicGallery).toHaveBeenCalledWith(
        20,
        20, // offset = (page - 1) * limit
        expect.any(Object)
      );
    });

    it('should support sorting', async () => {
      vi.mocked(RendersDAL.getPublicGallery).mockResolvedValue([]);

      await getPublicGallery(1, 20, { sortBy: 'most_liked' });

      expect(RendersDAL.getPublicGallery).toHaveBeenCalledWith(
        20,
        0,
        expect.objectContaining({ sortBy: 'most_liked' })
      );
    });

    it('should support filters', async () => {
      vi.mocked(RendersDAL.getPublicGallery).mockResolvedValue([]);

      await getPublicGallery(1, 20, {
        filters: {
          style: ['modern'],
          quality: ['high'],
        },
      });

      expect(RendersDAL.getPublicGallery).toHaveBeenCalledWith(
        20,
        0,
        expect.objectContaining({
          filters: expect.objectContaining({
            style: ['modern'],
            quality: ['high'],
          }),
        })
      );
    });
  });

  describe('getLongestChains', () => {
    it('should get longest chains', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await getLongestChains(5);

      expect(result.success).toBe(true);
    });
  });

  describe('likeGalleryItem', () => {
    it('should like gallery item', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      const result = await likeGalleryItem('render-id', testUser.id);

      expect(result.success).toBe(true);
    });
  });

  describe('unlikeGalleryItem', () => {
    it('should unlike gallery item', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      const result = await unlikeGalleryItem('render-id', testUser.id);

      expect(result.success).toBe(true);
    });
  });
});

