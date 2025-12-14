/**
 * Unit tests for RenderChainService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderChainService } from '@/lib/services/render-chain';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RendersDAL } from '@/lib/dal/renders';

vi.mock('@/lib/dal/render-chains', () => ({
  RenderChainsDAL: {
    create: vi.fn(),
    getByProjectId: vi.fn(),
    addRender: vi.fn(),
    getChainWithRenders: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/dal/renders', () => ({
  RendersDAL: {
    getByChainId: vi.fn(),
  },
}));

describe('RenderChainService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChain', () => {
    it('should create a new chain', async () => {
      const mockChain = {
        id: 'chain-id',
        projectId: 'project-id',
        name: 'Test Chain',
      };

      vi.mocked(RenderChainsDAL.create).mockResolvedValue(mockChain as any);

      const result = await RenderChainService.createChain('project-id', 'Test Chain');

      expect(result).toEqual(mockChain);
      expect(RenderChainsDAL.create).toHaveBeenCalledWith({
        projectId: 'project-id',
        name: 'Test Chain',
      });
    });
  });

  describe('getOrCreateDefaultChain', () => {
    it('should return existing chain if available', async () => {
      const mockChain = {
        id: 'chain-id',
        projectId: 'project-id',
        name: 'Existing Chain',
      };

      vi.mocked(RenderChainsDAL.getByProjectId).mockResolvedValue([mockChain] as any);

      const result = await RenderChainService.getOrCreateDefaultChain('project-id');

      expect(result).toEqual(mockChain);
      expect(RenderChainsDAL.create).not.toHaveBeenCalled();
    });

    it('should create new chain if none exists', async () => {
      const mockChain = {
        id: 'chain-id',
        projectId: 'project-id',
        name: 'Project - Iterations',
      };

      vi.mocked(RenderChainsDAL.getByProjectId).mockResolvedValue([]);
      vi.mocked(RenderChainsDAL.create).mockResolvedValue(mockChain as any);

      const result = await RenderChainService.getOrCreateDefaultChain('project-id', 'Project');

      expect(result).toEqual(mockChain);
      expect(RenderChainsDAL.create).toHaveBeenCalled();
    });
  });

  describe('getChain', () => {
    it('should get chain with renders', async () => {
      const mockChainWithRenders = {
        id: 'chain-id',
        renders: [
          { id: 'render-1', chainPosition: 1 },
          { id: 'render-2', chainPosition: 2 },
        ],
      };

      vi.mocked(RenderChainsDAL.getChainWithRenders).mockResolvedValue(mockChainWithRenders as any);

      const result = await RenderChainService.getChain('chain-id');

      expect(result).toEqual(mockChainWithRenders);
    });

    it('should return null if chain not found', async () => {
      vi.mocked(RenderChainsDAL.getChainWithRenders).mockResolvedValue(null);

      const result = await RenderChainService.getChain('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getNextChainPosition', () => {
    it('should get next position in chain', async () => {
      const mockRenders = [
        { chainPosition: 1 },
        { chainPosition: 2 },
        { chainPosition: 3 },
      ];

      vi.mocked(RendersDAL.getByChainId).mockResolvedValue(mockRenders as any);

      const result = await RenderChainService.getNextChainPosition('chain-id');

      expect(result).toBe(4);
    });

    it('should return 1 if no renders in chain', async () => {
      vi.mocked(RendersDAL.getByChainId).mockResolvedValue([]);

      const result = await RenderChainService.getNextChainPosition('chain-id');

      expect(result).toBe(1);
    });
  });
});

